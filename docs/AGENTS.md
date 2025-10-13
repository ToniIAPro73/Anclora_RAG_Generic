# Repository Guidelines

## Project Structure & Module Organization
- `apps/api`: FastAPI + LlamaIndex backend (routers in `routes/`, pipeline RAG in `rag/`, workers/scripts).
- `apps/web`: Next.js 15 frontend (`app/` routes, `components/`, `lib/`). Tailwind config lives in `apps/web/tailwind.config.ts`.
- `packages/`: Reusable Python modules (parsers, rag-core) shared by API.
- `infra/docker`: Docker Compose manifests for local stack (Postgres, Redis, Qdrant, Ollama, API, Worker).
- `docs/`: Onboarding and specs (`INGESTA-AVANZADA.md`, `ESTADO_PROYECTO.md`).
- `scripts/`: Automation (PowerShell helpers, backup utilities).

## Build, Test & Development Commands
- **Backend**: `cd apps/api && docker compose -f ../../infra/docker/docker-compose.dev.yml up` spins full stack; use `uvicorn main:app --reload` for single-service dev.
- **Frontend**: `cd apps/web && npm install && npm run dev` (port 3030). `npm run build` builds production bundle.
- **Quality**: `npm run lint` (web). Python lint/tests pending—run `pytest` manually when suites land.

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indent, descriptive snake_case modules. Favor dependency injection via `Depends` in FastAPI.
- TypeScript/React: PascalCase components (`components/UploadZone.tsx`), camelCase hooks. Tailwind utility-first styling.
- Commit prefix convention observed: Conventional Commits (`feat(api): ...`, `fix(web): ...`); follow same format.

## Testing Guidelines
- Web: Future Playwright integration (TBD). Meanwhile, keep components unit-testable; colocate tests under `__tests__` when introduced.
- API: Adopt `pytest` with fixtures for Qdrant/Postgres mocks. Name test modules `test_<feature>.py`.
- Ensure manual verification covers file ingestion + query path before PR approval.

## Commit & Pull Request Guidelines
- Use Conventional Commit messages (`fix(web): normalize ingestion toast`). Reference issues via `(#ID)` when applicable.
- PR checklist: summary of changes, test evidence (command output or screenshots), note on migrations/data impacts, and ensure `docker-compose` stack still boots.

## Security & Configuration Tips
- Keep `.env` out of Git; use `.env.example` as template. Never commit real credentials.
- `AUTH_BYPASS` should remain `true` only for local dev—disable in shared/staging environments.
- Regenerate backups via `scripts/powershell/backup_repo.ps1 -DumpDocker` before major refactors.
