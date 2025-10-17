<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Repository Guidelines

## Project Structure & Module Organization
- `apps/api`: FastAPI RAG service (endpoints in `routes/`, orchestration in `rag/`, jobs in `workers/`).
- `apps/web`: Next.js 15 client (`app/`, `components/`, `tailwind.config.ts`).
- `packages/`: Shared Python libs (`parsers/`, `rag-core/`).
- `infra/docker`: Compose stacks for Postgres, Redis, Qdrant, Ollama, API, worker.
- `scripts/`, `tests/`, `testsprite_tests/`: Automation helpers, fixtures, QA scripts.

## Build, Test & Development Commands
- `docker compose -f infra/docker/docker-compose.dev.yml up --build`: boots the dev stack (`--detach` optional).
- `cd apps/api && uvicorn main:app --reload`: serves the API only; ensure `.env` variables are loaded.
- `cd apps/web && npm install && npm run dev`: starts the web client on port 3030 (`npm run build` for production).
- `python scripts/verify_system.py`: checks Docker, Ollama, and model assets.
- `npm run lint` in `apps/web`: enforce ESLint/Tailwind defaults; resolve warnings before committing.

## Coding Style & Naming Conventions
Python follows PEP 8, 4-space indents, snake_case files, and dependency injection via FastAPI `Depends`. React components stay PascalCase, hooks/utilities camelCase, Tailwind classes inline, shared tokens in `lib/`. Keep configuration in code config files or env vars; never inline secrets or local paths.

## Testing Guidelines
Run `pytest` from `apps/api` for backend units (`test_<feature>.py`) and mock externals or reuse the compose stack for integrations. Port stable `testsprite_tests/` scenarios into Playwright or React Testing Library under `apps/web/__tests__/`.

## Commit & Pull Request Guidelines
History shows brief Spanish imperatives (e.g., `nuevas correcciones en archivos .md`); keep them concise but move toward Conventional Commits (`feat(api): add rerank fallback`). PRs need a summary, impact radius, test evidence or rationale, linked tasks, and screenshots or curl traces for user-facing work. Request module owners as reviewers.

## Security & Configuration Tips
Copy `.env.example`, keep secrets out of Git, and reset Postgres/Redis with `docker compose down -v` before sharing data. Run `scripts/backup_qdrant.sh` before schema changes, and keep `AUTH_BYPASS=true` strictly local.
