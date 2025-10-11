# Repository Guidelines

## Project Structure & Module Organization
- `apps/api/` holds the FastAPI service; place routers in `routes/` and shared RAG flows in `rag/`.
- `packages/` hosts reusable libraries such as `parsers/`; publish changes with semantic versions.
- `infra/docker/` keeps compose manifests; one-off helpers live in `scripts/`.
- Mirror code layout in tests: `apps/api/tests/<module>/` for units, `apps/api/tests/integration/` for stack coverage.
- Heavy checkpoints belong in `models/`; never commit generated artefacts or sensitive inputs.

## Build, Test, and Development Commands
- `python -m venv .venv && .venv\Scripts\activate` (or `source .venv/bin/activate`): create and enter the Python 3.11 virtualenv.
- `pip install -r apps/api/requirements.txt`: install API dependencies; rerun after updating requirements.
- `cd apps/api && uvicorn main:app --reload --port 8000`: launch the API with auto-reload against your local `.env`.
- `docker compose -f infra/docker/docker-compose.dev.yml up --build`: start the full stack (API, Qdrant, Redis, Ollama) with source mounts.
- `pytest apps/api -q`: execute all Python tests; append `-k <pattern>` to scope runs during iteration.

## Coding Style & Naming Conventions
- Follow PEP 8, 4-space indents, and a 100-character soft limit; keep docstrings focused on intent.
- Use snake_case for modules and functions, PascalCase for classes, and UPPER_SNAKE_CASE for constants.
- Type-hint public APIs; mirror patterns in `apps/api/rag/pipeline.py`. Prefer `logging.getLogger(__name__)` over prints.

## Testing Guidelines
- Use `pytest` for all suites; monkeypatch external clients and rely on factories for fixtures.
- Decorate async tests with `pytest.mark.asyncio`; name files `test_<module>.py` with explicit assertions.
- Run `pytest apps/api -q` pre-PR; keep Qdrant/Ollama exercises in integration tests run via compose.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat(api): add rerank step`), with scopes and `!` for breaking changes.
- PRs must link the issue, summarise behaviour shifts, list verification steps, and surface env or infra impacts.
- Confirm tests pass locally, request review, and refresh docs (README, AGENTS) when workflows change.

## Security & Configuration
- Copy `.env.example` to `.env`, supply OpenAI/Qdrant/Redis secrets locally, and keep them out of git.
- Mount caches through compose (`${USERPROFILE}`) and store tokens in OS keychains or Docker secrets.
- Rotate credentials when access changes and document new configuration toggles here or in `README.md`.
