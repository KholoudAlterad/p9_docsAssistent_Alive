# Alive - Document-Based Character Assistant

A conversational AI assistant that brings any character or persona to life based on your documents. Upload files about anyone—historical figures, fictional characters, real people, or original creations—and chat with them as if they were speaking directly to you. Built with FastAPI, LangChain, FAISS, and a modern React frontend.

## Features
- **Persona-based conversations**: Define any persona (e.g., "Sherlock Holmes", "Marie Curie", "your grandfather", or a fictional character) and chat as if speaking with them
- **Multi-format document upload**: PDF, DOCX, TXT, MD
- **RAG (Retrieval-Augmented Generation)**: FAISS vector store with OpenAI embeddings
- **Conversational memory**: Per-session chat history
- **Source citations**: Top-3 relevant excerpts with page numbers
- **Modern UI**: React + TailwindCSS with historical and modern themes
- **Production-ready**: Docker Compose deployment on AWS Elastic Beanstalk

## Tech Stack
- **Backend**: FastAPI, LangChain, FAISS, OpenAI (gpt-4o-mini, text-embedding-3-small)
- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui, Lucide icons
- **Deployment**: Docker Compose, Nginx reverse proxy, AWS Elastic Beanstalk

## Requirements
- Docker & Docker Compose (for containerized deployment)
- OpenAI API key
- (Local dev only) Python 3.11+, Node.js 20+

## Quickstart (Docker Compose)

1. **Set your OpenAI API key**:
   - Create a `.env` file in the project root:
     ```bash
     OPENAI_API_KEY=sk-...
     ```

2. **Build and run**:
   ```bash
   docker compose up --build
   ```

3. **Access the app**:
   - UI: http://localhost
   - API docs: http://localhost/api/docs (proxied through Nginx)

## Local Development (without Docker)

**Backend**:
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
export OPENAI_API_KEY="sk-..."  # Windows: $env:OPENAI_API_KEY="sk-..."
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 (dev server) or http://localhost:8000/docs (API)

## How It Works

1. **Create a session**: The UI automatically creates a session on load
2. **Upload documents**: Drag & drop or select PDF/DOCX/TXT/MD files about your character, optionally set a persona name (e.g., "Sherlock Holmes", "Ada Lovelace", or "Captain Reynolds")
3. **Chat**: Ask questions; the assistant responds in the persona's voice using only the uploaded documents
4. **View citations**: Each answer includes top-3 source excerpts with page numbers
5. **Reset**: Start a new conversation anytime

## API Endpoints

All endpoints are accessible via `/api/` when using Docker Compose (Nginx proxy).

- `POST /api/session` → `{"session_id": "..."}`
- `POST /api/upload` (multipart: `session_id`, `files[]`, optional `persona`)
- `POST /api/chat` (JSON: `{"session_id": "...", "message": "..."}`) → `{"answer": "...", "citations": [...]}`
- `POST /api/reset` (JSON: `{"session_id": "..."}`) → `{"status": "ok"}`

See http://localhost/api/docs for interactive API documentation.

## Deployment (AWS Elastic Beanstalk)

This project is configured for **Docker Compose** deployment on Elastic Beanstalk.

### Prerequisites
- EB CLI: `pip install awsebcli`
- AWS credentials configured

### Steps

1. **Initialize EB application** (first time only):
   ```bash
   eb init -p docker <app-name> --region us-east-1
   ```

2. **Create environment**:
   ```bash
   eb create <env-name> --envvars OPENAI_API_KEY=sk-...
   ```

3. **Deploy updates**:
   ```bash
   eb deploy
   ```

4. **Open the app**:
   ```bash
   eb open
   ```

### Configuration
- **Platform**: Docker running on Amazon Linux 2023 (Multi-container Docker with Compose)
- **Environment variables**: Set `OPENAI_API_KEY` in EB console → Configuration → Software
- **Health check**: Nginx serves on port 80; EB checks `/` (returns the React app)

### Troubleshooting on EC2

SSH into the instance:
```bash
eb ssh
```

Check containers:
```bash
cd /var/app/current
docker compose ps
docker logs current-backend-1
docker logs current-frontend-1
```

Test backend via Nginx proxy:
```bash
curl -i -X POST http://localhost/api/session
```

### Notes
- **Ephemeral storage**: Sessions and FAISS indices are in-memory; they reset on container restart
- **Scaling**: For multi-instance deployments, consider externalizing session state (Redis, DynamoDB) and FAISS indices (S3)

## Configuration

### Environment Variables
- **`OPENAI_API_KEY`** (required): Your OpenAI API key
- **`OPENAI_BASE_URL`** (optional): Custom OpenAI-compatible endpoint
- **`VITE_API_BASE`** (build-time, optional): API base URL for frontend; defaults to `/api` (Nginx proxy)

### CORS
- In production (Docker Compose), the frontend calls the backend via Nginx reverse proxy (`/api/*`), so CORS is not triggered
- For local dev with separate servers, backend allows `http://localhost:3000`

## Architecture

### Backend (FastAPI)
- **Session management**: In-memory dictionary (ephemeral)
- **Document processing**: LangChain loaders (PyPDF, Docx2txt, TextLoader)
- **Chunking**: RecursiveCharacterTextSplitter (1200 chars, 150 overlap)
- **Embeddings**: OpenAI `text-embedding-3-small`
- **Vector store**: FAISS (in-memory, per-session)
- **LLM**: `gpt-4o-mini` via ConversationalRetrievalChain
- **Persona prompts**: Dynamic system prompt based on user-defined persona

### Frontend (React + Vite)
- **UI framework**: React 18 with TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Themes**: Historical (dark parchment aesthetic) and Modern (light gradient)
- **State**: React hooks (no external state library)
- **API calls**: Native `fetch` to `/api/*` endpoints

### Deployment
- **Nginx**: Serves static frontend, proxies `/api/*` to backend on port 8000
- **Docker Compose**: Orchestrates `frontend` (Nginx) and `backend` (Uvicorn) services
- **Networking**: Both containers on the same Docker network; backend not exposed externally

## Limitations & Future Enhancements

### Current Limitations
- **No persistence**: Sessions and vector stores are in-memory; lost on restart
- **Single-instance**: Not suitable for multi-instance EB deployments without external state
- **No authentication**: Open to anyone with the URL
- **File size**: Limited by Nginx `client_max_body_size` (50MB) and memory

### Potential Enhancements
- **Persistent storage**: Save FAISS indices to S3; load on session resume
- **Session store**: Use Redis or DynamoDB for multi-instance deployments
- **Authentication**: Add OAuth or API keys
- **Streaming responses**: Use Server-Sent Events for real-time LLM output
- **Advanced RAG**: Hybrid search (keyword + semantic), re-ranking, query expansion
- **Multi-language support**: Detect and handle non-English documents

## License
MIT
