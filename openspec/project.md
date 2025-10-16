# Project Context

## Purpose

Anclora RAG Generic delivers a retrieval-augmented assistant that centralizes company knowledge into a conversational interface. The goal is to ingest heterogeneous documents (PDF, DOCX, TXT, Markdown) into a searchable Qdrant vector store through a LlamaIndex pipeline, then serve multilingual (Spanish/English) answers with source citations over a secure FastAPI backend and a customizable Next.js web client.

## Tech Stack

- Backend: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, LlamaIndex 0.14.x, Qdrant client 1.15.x, Redis/RQ workers, JWT auth via python-jose, PDF/Doc ingestion helpers from `packages/`.
- Frontend: Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 3.4, Axios client, ESLint 9 with `eslint-config-next`.
- Data & LLM: Qdrant (vector DB), PostgreSQL (metadata), Ollama (llama3.2:1b) for inference, HuggingFace sentence transformers for embeddings.
- Tooling: Docker Compose (`infra/docker`), PowerShell helper scripts, `openspec` for spec-driven workflow, Conventional Commits.

## Project Conventions

### Code Style

- Python follows PEP 8 with 4-space indentation and dependency injection through FastAPI `Depends`; modules use snake_case and keep business logic in `services/` or `rag/`.
- TypeScript uses ESLint with Next.js defaults; components are PascalCase in `apps/web/components`, hooks/utilities camelCase in `apps/web/lib`; Tailwind utility classes drive styling.
- Shared packages in `packages/` expose explicit `__all__` and avoid side effects to keep imports predictable across API services.

### Architecture Patterns

- Monorepo layout: `apps/api` (FastAPI service), `apps/web` (Next.js client), `packages/` (shared Python libs), `infra/` (container orchestration), `scripts/` (automation), `openspec/` (change specs).
- Backend layering: `routes/` handle HTTP contracts, `services/` orchestrate use-cases, `rag/` encapsulates LlamaIndex pipelines, `database/` wraps SQLAlchemy sessions, and background jobs live in `workers/`.
- Frontend pattern: App Router pages under `apps/web/app`, stateful UI composed from `components/` with configuration management (theme, accent, density) stored in localStorage.
- Specs-first delivery: new capabilities flow through `openspec` proposals before implementation; code changes must sync with spec deltas.

### Testing Strategy

- API: Pytest and pytest-asyncio are installed; target coverage for ingestion, query, and auth flows using fixture-backed Qdrant/Postgres doubles. Run `pytest` from `apps/api`.
- Web: ESLint enforces static rules (`npm run lint`); upcoming Playwright suites should live beside features under `apps/web/__tests__`. Until then, prioritize integration smoke tests that exercise upload + chat paths against the dev API.
- Manual verification remains required before PR approval: ingest sample docs, run `/health`, and perform chat queries to ensure RAG responses include referenced sources.

### Git Workflow

- Default branch is `main`; feature work happens on short-lived branches named after the `openspec` change ID (e.g., `feature/add-api-client`).
- Commit messages follow Conventional Commits (e.g., `fix(web): wire chat API client`) and should reference spec change IDs when relevant.
- Pull requests summarize scope, list validation commands (pytest, lint, openspec validate), and confirm the Docker Compose stack (`infra/docker/docker-compose.dev.yml`) still boots.

## Domain Context

- Target users need a chat assistant grounded in internal operational documents; accuracy depends on ingesting high-quality source files with consistent metadata.
- The pipeline supports Spanish and English, so language detection and routing are important when parsing content and generating answers.
- Queries must return cited passages to preserve trust; responses should degrade gracefully when retrieval returns low-confidence matches.

## Important Constraints

- Local stack depends on Qdrant, PostgreSQL, Redis, and Ollama exposed on custom ports (3030 web, 8030 API, 5462 Postgres, 6363 Qdrant, 6389 Redis, 11464 Ollama) documented in `docs/PUERTOS.md`.
- CORS is currently wide open on the API; tighten it before production but preserve `localhost:3030` for dev.
- Auth bypass (`AUTH_BYPASS=true`) exists for local use and must be disabled in shared environments; JWT roles (ADMIN, VIEWER) gate sensitive routes.
- Frontend still lacks `apps/web/lib/api.ts`; integrations should align with backend routes (`/auth/login`, `/ingest`, `/query`) and reuse shared DTO definitions.
- Large file ingestion can stress resources—monitor Docker Compose memory limits and throttle vector uploads in production.

## External Dependencies

- Qdrant vector database (Docker service or managed instance).
- PostgreSQL database for metadata and auth records.
- Redis queue for background ingestion/batch jobs via RQ workers.
- Ollama runtime hosting llama3.2:1b or compatible local LLM.
- HuggingFace model hub downloads for embedding models (sentence-transformers) and Llama Parse when using advanced ingestion.
