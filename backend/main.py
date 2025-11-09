import os
import uuid
import tempfile
import shutil
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

base_url = os.getenv("OPENAI_BASE_URL")
if base_url and not os.getenv("OPENAI_API_BASE"):
    os.environ["OPENAI_API_BASE"] = base_url

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: Dict[str, Dict[str, Any]] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ResetRequest(BaseModel):
    session_id: str


def ensure_openai_key() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")


def build_persona_prompt(persona: Optional[str]) -> PromptTemplate:
    persona_label = persona.strip() if persona else "the individual described in the provided sources"
    template = (
        f"You are {persona_label} speaking with a curious visitor.\n"
        "Stay strictly in character and speak in the first person.\n"
        "Use only the information from the source excerpts to answer.\n"
        "If the excerpts do not contain the answer, admit you cannot recall.\n"
        "Keep the reply vivid yet concise and avoid inventing facts.\n\n"
        "Conversation so far:\n{chat_history}\n\n"
        "Visitor question:\n{question}\n\n"
        "Source excerpts:\n{context}\n\n"
        "Respond in the persona's voice.\n"
        "Let the answe be accurate and concise."
    )
    return PromptTemplate(
        input_variables=["chat_history", "question", "context"],
        template=template,
    )


def build_chain(session_data: Dict[str, Any]) -> ConversationalRetrievalChain:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    prompt = build_persona_prompt(session_data.get("persona"))
    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=session_data["retriever"],
        return_source_documents=True,
        combine_docs_chain_kwargs={"prompt": prompt},
    )


def new_session() -> str:
    session_id = uuid.uuid4().hex
    tmp_dir = tempfile.mkdtemp(prefix=f"rag_{session_id}_")
    sessions[session_id] = {
        "chat_history": [],
        "vectorstore": None,
        "retriever": None,
        "chain": None,
        "tmp_dir": tmp_dir,
        "persona": None,
    }
    return session_id


def get_session(session_id: str) -> Dict[str, Any]:
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Invalid session_id")
    return sessions[session_id]


def load_documents_to_tmp(files: List[UploadFile], tmp_dir: str) -> List[Any]:
    docs = []
    for f in files:
        filename = f.filename or uuid.uuid4().hex
        ext = os.path.splitext(filename)[1].lower()
        allowed = {".pdf", ".docx", ".txt", ".md"}
        if ext not in allowed:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
        dst_path = os.path.join(tmp_dir, filename)
        with open(dst_path, "wb") as out:
            out.write(f.file.read())
        if ext == ".pdf":
            loader = PyPDFLoader(dst_path)
            ld = loader.load()
        elif ext == ".docx":
            loader = Docx2txtLoader(dst_path)
            ld = loader.load()
        else:
            loader = TextLoader(dst_path, autodetect_encoding=True)
            ld = loader.load()
        for d in ld:
            meta = d.metadata or {}
            meta.setdefault("source", filename)
            d.metadata = meta
        docs.extend(ld)
    return docs


@app.post("/session")
async def create_session():
    sid = new_session()
    return {"session_id": sid}


@app.post("/upload")
async def upload_documents(
    session_id: str = Form(...),
    files: List[UploadFile] = File(...),
    persona: Optional[str] = Form(None),
):
    ensure_openai_key()
    session = get_session(session_id)
    if persona is not None:
        session["persona"] = persona
    docs = load_documents_to_tmp(files, session["tmp_dir"])
    if not docs:
        raise HTTPException(status_code=400, detail="No documents were loaded")
    splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=150)
    chunks = splitter.split_documents(docs)
    if session["vectorstore"] is None:
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vs = FAISS.from_documents(chunks, embeddings)
        session["vectorstore"] = vs
    else:
        session["vectorstore"].add_documents(chunks)
    session["retriever"] = session["vectorstore"].as_retriever(search_kwargs={"k": 4})
    session["chain"] = build_chain(session)
    return {"status": "ok", "documents": len(docs), "chunks": len(chunks)}


@app.post("/chat")
async def chat(request: ChatRequest):
    ensure_openai_key()
    session = get_session(request.session_id)
    if session["vectorstore"] is None:
        raise HTTPException(status_code=400, detail="Upload documents before chatting")
    if session["chain"] is None:
        if session.get("retriever") is None:
            session["retriever"] = session["vectorstore"].as_retriever(search_kwargs={"k": 4})
        session["chain"] = build_chain(session)
    result = session["chain"]({
        "question": request.message,
        "chat_history": session["chat_history"],
    })
    answer = result.get("answer", "")
    src_docs = result.get("source_documents", [])
    citations = []
    for d in src_docs[:3]:
        source = d.metadata.get("source") if d.metadata else None
        page = d.metadata.get("page") if d.metadata else None
        try:
            if page is not None:
                page = int(page) + 1
        except Exception:
            pass
        snippet = (d.page_content or "")[:400]
        citations.append({
            "source": os.path.basename(source) if source else None,
            "page": page,
            "snippet": snippet,
        })
    session["chat_history"].append((request.message, answer))
    return {"answer": answer, "citations": citations}


@app.post("/reset")
async def reset_session(request: ResetRequest):
    if request.session_id not in sessions:
        return {"status": "ok"}
    tmp_dir = sessions[request.session_id].get("tmp_dir")
    try:
        if tmp_dir and os.path.isdir(tmp_dir):
            shutil.rmtree(tmp_dir, ignore_errors=True)
    finally:
        del sessions[request.session_id]
    return {"status": "ok"}
