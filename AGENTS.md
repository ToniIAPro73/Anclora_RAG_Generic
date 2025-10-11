# Repository Guidelines

## Project Structure & Module Organization
- `apps/api/` hosts the FastAPI service; keep routers in `routes/` and shared RAG logic in `rag/`.
- `packages/` contains reusable libraries such as `parsers/`; version updates semantically.
- `infra/docker/` stores docker-compose manifests, while automation helpers belong in `scripts/`.
- Mirrors code in tests: `apps/api/tests/<module>/` for units and `apps/api/tests/integration/` for stack flows.
- Place large checkpoints in `models/` and keep generated artefacts or sensitive data out of git.

## Architecture Overview
- Requests enter FastAPI, reach `rag.pipeline`, and embed content with LlamaIndex + HuggingFace models.
- Qdrant stores vectors, Redis feeds RQ workers, and Ollama powers inference.

## Build, Test, and Development Commands
- `python -m venv .venv && .venv\Scripts\activate` (or `source .venv/bin/activate`): create and enter the Python 3.11 venv.
- `pip install -r apps/api/requirements.txt`: install or refresh dependencies.
- `cd apps/api && uvicorn main:app --reload --port 8000`: run the API with hot reload.
- `docker compose -f infra/docker/docker-compose.dev.yml up --build`: launch the stack (API, Qdrant, Redis, Postgres, Ollama).
- `pytest apps/api -q`: execute tests; add `-k <pattern>` when iterating.

## Coding Style & Naming Conventions
- Follow PEP 8 with 4-space indentation, a 100-character soft limit, and intent-focused docstrings.
- Use snake_case for modules and functions, PascalCase for classes, and UPPER_SNAKE_CASE for constants.
- Type-hint public APIs, mirror `apps/api/rag/pipeline.py`, and prefer `logging.getLogger(__name__)`.

## Testing Guidelines
- Use `pytest`; monkeypatch external clients (e.g., `qdrant_client`) and rely on fixture factories.
- Decorate async tests with `pytest.mark.asyncio`; name files `test_<module>.py` with explicit assertions.
- Run `pytest apps/api -q` pre-PR; keep Qdrant/Ollama exercises inside docker-backed integration suites.

## Commit & Pull Request Guidelines
- Write Conventional Commits (`feat(api): add rerank step`) with scopes; append `!` when behaviour changes.
- PRs must link the motivating issue, summarise behaviour shifts, list verification steps, and flag infra/env impacts.
- Ensure tests pass locally, request review, and update docs (README, AGENTS) whenever workflows evolve.

## Agent Operations
- Prefer scripted automation in `scripts/`; send diagnostics to `logs/` and clean outputs after runs.
- When coordinating containers, restart with `docker compose ... restart api` and wait for the health check before firing ingestion tests.

## Security & Configuration
- Copy `.env.example` to `.env`, supply OpenAI/Qdrant/Redis credentials locally, and never commit secrets.
- Mount caches via compose (`${USERPROFILE}`); store tokens inside OS keychains or Docker secrets.
- Rotate credentials as access changes and document configuration toggles here or in `README.md`.
