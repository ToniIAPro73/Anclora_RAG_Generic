# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (FastAPI + LlamaIndex)

- **Full stack**: `docker compose -f infra/docker/docker-compose.dev.yml up`
  - Spins up Postgres (port 5462), Qdrant (6363), Redis (6389), Ollama (11464), API (8030), and Worker
- **API only** (after services are running): `cd apps/api && uvicorn main:app --reload --port 8000`
- **Tests**: `cd apps/api && pytest` (test suites pending—framework is set up)
- **Python environment**: Use the virtualenv at `apps/api/venv` or create a new one with `pip install -r apps/api/requirements.txt`

### Frontend (Next.js 15)

- **Install**: `cd apps/web && npm install`
- **Dev server**: `npm run dev` (runs on port 3030)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

### Utilities

- **Backup**: Run `scripts/powershell/backup_repo.ps1 -DumpDocker` before major refactors
- **Verify system**: `python scripts/verify_system.py`

## Architecture Overview

### Monorepo Structure

- `apps/api/`: FastAPI backend with RAG pipeline
  - `routes/`: API endpoints (auth, ingest, query, health, batch)
  - `rag/pipeline.py`: Core RAG logic—documents → nodes → embeddings → Qdrant
  - `workers/`: RQ background worker (declared but not yet utilized; ingestion is currently synchronous)
  - `models/`, `database/`, `clients/`: Data models, DB layer, external service clients
  - `services/`: Business logic layer
- `apps/web/`: Next.js 15 frontend
  - `app/page.tsx`: Main dashboard (ingestion + chat interface)
  - `app/configuracion/`: UI settings (theme, language, typography, density)
  - `app/ingesta-avanzada/`: Documentation-only view for advanced ingestion (backend not implemented)
  - `components/`, `lib/`, `contexts/`: Reusable UI components, utilities, and React contexts
- `packages/`: Shared Python modules
  - `parsers/`: Document parsers (PDF, DOCX, Markdown, TXT)
  - `rag-core/`: Reusable RAG utilities (if any)
- `infra/docker/`: Docker Compose manifests for local development
- `docs/`: Project documentation (`AGENTS.md`, `ESTADO_PROYECTO.md`, `INGESTA-AVANZADA.md`)
- `scripts/`: PowerShell automation (backups, system verification)

### RAG Pipeline Architecture

1. **Ingestion** (`apps/api/routes/ingest.py`):
   - Accepts PDF/DOCX/TXT/MD files via `/ingest` endpoint
   - Currently synchronous (blocking)—RQ integration planned
   - Parsers extract text, which is chunked by `SentenceSplitter` (512 tokens, 80 overlap)
2. **Embeddings**: Uses `nomic-ai/nomic-embed-text-v1.5` (768 dimensions) via HuggingFace
3. **Vector Store**: Qdrant collection `documents` with cosine similarity
4. **Query** (`apps/api/routes/query.py`):
   - Instantiates `VectorStoreIndex` and Ollama LLM (default `llama3.2:1b`, configurable via `OLLAMA_MODEL`) per request
   - Returns generated answer + source metadata
   - **Performance note**: Index and LLM sessions are recreated on every request—caching is planned

### Authentication & Security

- **Current state**: `AUTH_BYPASS=true` in `.env` allows unrestricted access for local dev
  - Returns a mock admin user in all requests
- **Production**: Disable `AUTH_BYPASS`, implement OAuth2/JWT with proper roles and scopes
- **Best practice**: Never commit real credentials; use `.env.example` as a template

### Frontend State Management

- UI settings (theme, language, typography, density) managed by `ui-settings-context.tsx`
- Persisted to `localStorage`
- Applies CSS variables dynamically for theming

## Key Technical Details

### Qdrant Collection Setup

- Collection name: `documents`
- Embedding dimension: 768
- Distance metric: Cosine
- Defensive pattern: `_patch_collection_exists` in `rag/pipeline.py` handles backward compatibility for collection checks

### Environment Variables

- Backend uses `.env` at project root (referenced by Docker Compose)
- Frontend uses Next.js conventions (prefix with `NEXT_PUBLIC_` for client-side exposure)
- Critical vars: `QDRANT_URL`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `EMBEDDING_MODEL`, `AUTH_BYPASS`, `POSTGRES_*`, `REDIS_URL`

### Docker Compose Services

- All services defined in `infra/docker/docker-compose.dev.yml`
- Volumes persist data across restarts: `postgres_data`, `qdrant_data`, `redis_data`, `ollama_data`
- HuggingFace cache mounted from host: `${USERPROFILE}/.cache/huggingface:/root/.cache/huggingface`

## Common Workflows

### Adding a New Document Parser

1. Create a new parser module in `packages/parsers/`
2. Follow the pattern in existing parsers (e.g., `pdf.py`, `docx_parser.py`)
3. Register MIME type handling in `apps/api/routes/ingest.py`
4. Update `packages/parsers/__init__.py` to export the new parser

### Modifying the RAG Pipeline

- Core logic is in `apps/api/rag/pipeline.py`
- Global settings (embedding model, node parser) are configured at module level
- To change chunking strategy: modify `NODE_PARSER` (SentenceSplitter params)
- To change embedding model: update `EMBED_MODEL` and ensure `EMBED_DIMENSION` matches

### Adding a New API Route

1. Create a new router file in `apps/api/routes/`
2. Import and include it in `apps/api/main.py` via `app.include_router()`
3. Use FastAPI's `Depends` for dependency injection (e.g., authentication, DB session)

### Updating the Frontend

- Components follow PascalCase (`UploadZone.tsx`)
- Use Tailwind utility-first styling (config at `apps/web/tailwind.config.ts`)
- For global state, extend `ui-settings-context.tsx` or create a new context

## Known Limitations & TODOs

- **Ingestion is synchronous**: No progress feedback, blocks API during large uploads (RQ integration pending)
- **Query performance**: Index and LLM instances recreated per request—caching needed
- **Authentication**: `AUTH_BYPASS` must be disabled for production; real OAuth2/JWT required
- **Advanced ingestion**: UI exists at `/ingesta-avanzada`, but backend features (batch, GitHub import, structured sources) are not implemented
- **Tests**: Framework is installed (`pytest`, `pytest-asyncio`), but test suites are minimal or missing
- **Observability**: Basic logging only—no structured logging, metrics, or tracing
- **CI/CD**: No automated pipelines yet

## Commit Guidelines

- Use Conventional Commits: `feat(api):`, `fix(web):`, `docs:`, `refactor:`, etc.
- Reference issues where applicable: `fix(api): normalize toast for accented filenames (#42)`
- PR checklist: summary, test evidence, migration/data impact notes, verify Docker Compose stack boots

## Testing Strategy (Planned)

- **Backend**: `pytest` with fixtures for Qdrant/Postgres mocks; place tests in `apps/api/tests/` as `test_<feature>.py`
- **Frontend**: Playwright for E2E (TBD); colocate component tests under `__tests__/` when introduced
- Manual verification: Always test ingestion + query path end-to-end before merging

## Reference Documents

- `docs/AGENTS.md`: Repository guidelines, coding style, PR workflow
- `docs/ESTADO_PROYECTO.md`: Detailed project status, functional areas, improvement roadmap
- `docs/INGESTA-AVANZADA.md`: Specifications for advanced ingestion features (not yet implemented)
