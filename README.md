# Intelligent Document Assistant (MVP) + Web UI

Minimal FastAPI + LangChain RAG app using FAISS and OpenAI, with a Vite React frontend.

Checks the required checkpoints:
- Upload multiple document formats (PDF, DOCX, TXT, MD)
- Vector database: FAISS (MVP)
- LangChain for document Q&A
- Conversation memory (per-session)
- Source citations
- OpenAI + LangChain integration

## Requirements
- Python 3.11+
- Node.js 18+
- OpenAI API key

## Quickstart (local)

Backend (FastAPI)

Windows PowerShell:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:OPENAI_API_KEY="YOUR_KEY_HERE"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (Vite React)
```powershell
cd frontend
npm install
npm run dev -- --port 3000
```

Open UI: http://localhost:3000
Open API docs: http://localhost:8000/docs

Note: Backend CORS currently allows only http://localhost:3000. To use Vite’s default port (5173), update the allowed origins in the backend or run dev on port 3000 as shown.

## API Walkthrough

1) Create a session
```bash
curl -s -X POST http://localhost:8000/session
# {"session_id":"..."}
```

2) Upload documents
- Supported: .pdf, .docx, .txt, .md

Bash (adjust to your shell):
```bash
SID=$(curl -s -X POST http://localhost:8000/session | jq -r .session_id)

curl -s -X POST \
  -F "session_id=$SID" \
  -F "files=@samples/doc1.pdf" \
  -F "files=@samples/notes.md" \
  http://localhost:8000/upload
```

PowerShell:
```powershell
$SID = (Invoke-RestMethod -Method Post http://localhost:8000/session).session_id
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/upload `
  -Form @{ session_id=$SID; files=Get-Item .\samples\doc1.pdf; files=Get-Item .\samples\notes.md }
```

3) Chat
```bash
curl -s -X POST http://localhost:8000/chat \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"'"$SID"'","message":"What does the document say about X?"}'
```
Response includes `answer` and top-3 `citations` with `source`, `page` (if PDF), and snippet.

4) Reset session
```bash
curl -s -X POST http://localhost:8000/reset -H 'Content-Type: application/json' -d '{"session_id":"'"$SID"'"}'
```

## Docker

Build and run:
```bash
docker build -t doc-assistant:latest .
docker run --rm -it -p 8000:8000 -e OPENAI_API_KEY=YOUR_KEY doc-assistant:latest
```
Open http://localhost:8000/docs (API). The frontend runs separately (see Quickstart).

## Elastic Beanstalk (single container)

- Platform: Docker running on Amazon Linux 2
- Source bundle: this repo with `Dockerfile`
- Env var: set `OPENAI_API_KEY` in EB console

Steps (high-level):
- Zip project (Dockerfile + app + requirements.txt) and upload to EB application
- EB will build the image from Dockerfile and run the container
- Health check: `GET /docs` should return 200

Note: EB instance storage is ephemeral. This MVP uses per-session in-memory FAISS (no persistence). For persistence, either save/load FAISS to S3 or run a Chroma server with EFS (future enhancement).

## Configuration
- Env vars:
  - `OPENAI_API_KEY` (required)
  - `OPENAI_BASE_URL` (optional; override API base URL if using a non-default endpoint)
  - Frontend: `VITE_API_BASE` (optional; defaults to http://localhost:8000)

- CORS: backend allows `http://localhost:3000` by default. Either run the Vite dev server on port 3000 or add `http://localhost:5173` to allowed origins in the backend.

## Design notes
- Per-session architecture (simple, no cross-user leaks)
- FAISS vector store, `text-embedding-3-small` embeddings
- `gpt-4o-mini` LLM for cost-effective chat
- Chunking: 1200 chars, overlap 150
- Citations from document metadata (`source`, `page`)

## Limitations
- No persistence across restarts
- No UI (API-first). Add a small web UI if needed.

## License
MIT
