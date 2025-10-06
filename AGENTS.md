# Repository Guidelines

## Project Structure & Module Organization
The workspace is split into service-focused folders: `apps/api` holds the FastAPI service (routers live in `routes/`, shared workflows in `rag/`), `packages/` collects standalone Python packages such as `parsers` for file ingestion helpers, and `infra/docker/` stores compose files for local orchestration. Shared assets like downloaded checkpoints belong under `models/`, while throwaway scripts belong in `scripts/`. Place module-level tests under `apps/api/tests`, mirroring the package or route you cover.

## Build, Test, and Development Commands
- `python -m venv .venv && .venv\Scripts\activate`: create and activate a Python 3.11 virtualenv on Windows (use `source .venv/bin/activate` on Unix).
- `pip install -r apps/api/requirements.txt`: install backend dependencies.
- `cd apps/api && uvicorn main:app --reload --port 8000`: run the API with hot reload against your local `.env`.
- `docker compose -f infra/docker/docker-compose.dev.yml up --build`: bring up the full stack (API, Qdrant, Redis, Ollama) using the mounted source.
- `pytest apps/api -q`: execute the test suite with quiet output.

## Coding Style & Naming Conventions
Follow PEP 8 with 4-space indentation, limit lines to 100 characters, and include module-level docstrings where behaviour is not obvious. Keep modules and functions in snake_case (`routes/query.py`), reserve PascalCase for classes, and use explicit type hints on public functions (see `rag/pipeline.py` for patterns). Prefer logging via the shared `logging` configuration over bare prints.

## Testing Guidelines
Write unit tests with `pytest`, using `pytest.mark.asyncio` for coroutine endpoints and faking external services (e.g., monkeypatch `qdrant_client`). Target fast, deterministic tests; integration exercises that require Qdrant should run behind the compose stack and live under `tests/integration`. Name files `test_<module>.py`, and fail tests on missing assertions or unhandled exceptions. Aim for meaningful coverage around parsers, ingestion flows, and query pipelines.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits with optional multi-scope notation seen in history (`refactor(api,misc,infra): ...`). Use concise, imperative summaries and append `!` when behaviour changes. PRs must describe the change, reference the motivating issue, list verification steps (commands run, screenshots for UI), and highlight impacts on infrastructure or environment variables. Request review before merging and ensure CI/test results are attached.

## Environment & Configuration
Copy `.env.example` to `.env` and supply service credentials (OpenAI, Qdrant). Keep secrets out of source control and prefer Docker secrets or environment overrides in deployment. Shared caches (HuggingFace, models) mount from `${USERPROFILE}` in compose; avoid committing downloaded artefacts under `models/`.
