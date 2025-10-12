# Repository Guidelines

## Project Structure & Module Organization

The monorepo is grouped under `apps/`: `apps/api` hosts the FastAPI service (routers in `routes/`, data access in `database/` and `services/`), `apps/web` contains the Next.js front end, and `apps/packages` stores shared Python tooling (e.g. `rag-core`) and parsing utilities. Infrastructure scripts live in `infra/`, while reusable automation is under `scripts/`. Test fixtures and integration assets sit in `tests/`. Keep feature-specific assets close to their owning app to preserve clear ownership.

## Build, Test, and Development Commands

Install Python deps once per machine: `cd apps/api && pip install -r requirements.txt`. Run the API locally with `uvicorn main:app --reload --host 0.0.0.0 --port 8000`. Execute API tests via `pytest` from `apps/api`. For the web app, run `npm install` once, then `npm run dev` (port 3030), `npm run build` for production bundles, and `npm run lint` before pushing. Use `python scripts/verify_system.py` to confirm external services (Qdrant, embeddings, etc.) before demos.

## Coding Style & Naming Conventions

Python code follows PEP 8 with 4-space indentation, descriptive type hints, and snake_case modules. FastAPI routers should expose async endpoint functions and place shared logic in `services/`. Tests live alongside the code they validate using `test_<feature>.py`. In the Next.js app, favor TypeScript, PascalCase for components, and colocate UI logic within `app/<route>/`. Tailwind utility classes should be composed via shared helpers in `apps/web/lib/`. Run the relevant linters (`pytest`, `npm run lint`) before committing.

## Testing Guidelines

Add unit tests under `apps/api/tests` mirroring the package path (e.g. `tests/routes/test_query.py`). Mock outbound services via fixtures in `tests/resources`. Aim to cover new endpoints with async client tests and update regression checks when query semantics change. For the web app, extend lint coverage or add Playwright/React Testing Library suites within `apps/web` as features grow; document gaps when UI automation is deferred.

## Commit & Pull Request Guidelines

Follow Conventional Commits (`type(scope): message`), using `!` for breaking changes as seen in recent history. Group related file updates together and keep scopes narrow (`fix(api-auth): ...`). Pull requests must include: purpose summary, testing notes (command outputs or screenshots), and links to tracking issues or tickets. Request review from owners of affected apps, and include before/after visuals for UI changes hosted under `apps/web`.
