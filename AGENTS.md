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
- `apps/api`: FastAPI RAG service; endpoints in `routes/`, flows in `rag/`, worker jobs in `workers/`.
- `apps/web`: Next.js 15 app; UI in `app/`, shared components under `components/`, Tailwind tokens in `tailwind.config.ts`.
- `packages/`: Reusable Python libs such as `parsers/` and `rag-core/`.
- `infra/docker`: Compose stacks for Postgres, Redis, Qdrant, Ollama, API, worker.
- `scripts/`, `tests/`, `testsprite_tests/`: Automation helpers, fixtures, regression scripts.
- `openspec/`: Spec-driven change management; read before shipping new capabilities.

## Build, Test & Development Commands
- `docker compose -f infra/docker/docker-compose.dev.yml up --build`: bootstrap full stack (add `--detach` for background).
- `cd apps/api && uvicorn main:app --reload`: run API locally; load `.env` with RAG credentials.
- `cd apps/web && npm install && npm run dev`: start client on port 3030; use `npm run build` for production smoke tests.
- `python scripts/verify_system.py`: validate Docker, Ollama models, and Qdrant indexes.
- `npm run lint` in `apps/web`: enforce ESLint, Tailwind, and TypeScript rules.

## Coding Style & Naming Conventions
- Python: PEP 8, 4 spaces, snake_case modules, FastAPI dependencies via `Depends`.
- TypeScript/React: Components PascalCase, hooks/utilities camelCase; keep Tailwind classes inline.
- Prefer configuration files or env vars over inline secrets; share tokens via `apps/web/lib/`.

## Testing Guidelines
- Run `pytest` from `apps/api` for backend unit and integration tests; mock third-party services by default.
- Frontend tests live in `apps/web/__tests__/` using React Testing Library; migrate stable `testsprite_tests/` scenarios.
- Name tests `test_<feature>.py` or `<Component>.test.tsx`; keep coverage focused on approved behaviors.

## Commit & Pull Request Guidelines
- Follow concise imperative history; prefer Conventional Commit prefixes (`feat(api): ...`, `fix(web): ...`).
- Each PR needs a clear summary, impact radius, test proof (commands or rationale), linked task, and UX evidence (screenshots or curl) for user-facing changes.
- Request relevant module owners as reviewers and avoid unrelated changes in the same PR.

## Security & Configuration Tips
- Copy `.env.example` for local setups; never commit credentials.
- Run `scripts/backup_qdrant.sh` before schema edits; reset data with `docker compose down -v`.
- Keep `AUTH_BYPASS=true` strictly local and remove it before sharing environments.
