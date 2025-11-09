# Intelligent Document Assistant (MVP)

Minimal FastAPI + LangChain RAG app using FAISS and OpenAI.

Checks the required checkpoints:
- Upload multiple document formats (PDF, DOCX, TXT, MD)
- Vector database: FAISS (MVP)
- LangChain for document Q&A
- Conversation memory (per-session)
- Source citations
- OpenAI + LangChain integration

## Requirements
- Python 3.11+
- OpenAI API key

## Quickstart (local)

1) Create venv and install deps

Windows PowerShell:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:OPENAI_API_KEY="YOUR_KEY_HERE"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2) Open API docs at http://localhost:8000/docs

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
Open http://localhost:8000/docs

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
