# Repository Guidelines

## Project Structure & Module Organization
- `apps/api/` concentra la API FastAPI con rutas en `routes/`, flujo RAG en `rag/` y utilidades en `core/`.
- `packages/` alberga librerías como `parsers/`; versiona cambios con tags semánticos.
- `infra/docker/` guarda la orquestación local; usa `scripts/` para utilidades y `models/` para checkpoints. Los tests reflejan el árbol (`apps/api/tests/<módulo>/`, `apps/api/tests/integration/`).

## Architecture Overview
- FastAPI delega en `rag.pipeline`: trocea documentos, genera embeddings HuggingFace, almacena vectores en Qdrant y se apoya en Redis + workers RQ; Ollama suministra el LLM configurado en `.env` para `/query`.

## Build, Test & Development Commands
- `python -m venv .venv && .venv\Scripts\activate` (`source .venv/bin/activate`): crea y activa el entorno 3.11.
- `pip install -r apps/api/requirements.txt`: instala dependencias actualizadas.
- `cd apps/api && uvicorn main:app --reload --port 8000`: arranca la API con recarga automática.
- `docker compose -f infra/docker/docker-compose.dev.yml up --build`: levanta API, Qdrant, Redis, Postgres y Ollama según `PUERTOS.md`.
- `pytest apps/api -q`: ejecuta la suite de pruebas.

## Coding Style & Naming Conventions
- Cumple PEP 8 con indentación de 4 espacios y límite suave de 100 caracteres.
- snake_case para módulos y funciones, PascalCase para clases, UPPER_SNAKE_CASE para constantes.
- Tipifica las APIs públicas, toma como referencia `apps/api/rag/pipeline.py` y usa `logging.getLogger(__name__)`.

## Testing Guidelines
- Usa `pytest`; simula servicios externos (p. ej. `qdrant_client`) con fixtures o monkeypatch.
- Marca pruebas asíncronas con `pytest.mark.asyncio` y nombra archivos `test_<módulo>.py` con aserciones claras.
- Ejecuta `pytest apps/api -q` antes de cada PR; los tests que requieren Qdrant/Ollama se ejecutan con los contenedores activos.

## Commit & Pull Request Guidelines
- Aplica Conventional Commits (`feat(api): ...`); añade `!` cuando haya cambios incompatibles.
- Las PRs enlazan su issue, describen el impacto, listan verificaciones (tests, scripts) y destacan cambios en infraestructura o `.env`.
- Actualiza documentación pertinente (README, AGENTS) cuando cambien los flujos.

## Agent & Ops Tips
- Automatiza tareas en `scripts/` y limpia los logs temporales al terminar.
- Antes de probar ingestas o consultas, reinicia la API con `docker compose ... restart api` y espera al healthcheck.
- Crea backups con `powershell ./scripts/powershell/backup_repo.ps1` (o `-Auto` para usar el mecanismo diario); restaura con `restore_backup.ps1`.

## Security & Configuration
- Copia `.env.example` a `.env`, completa credenciales (Qdrant, Redis, Ollama) y mantenlas fuera de control de versiones.
- Monta caches con `${USERPROFILE}` o rutas compatibles y guarda tokens en gestores seguros.
- Documenta nuevas variables o toggles aquí o en `README.md` y rota credenciales cuando cambie el equipo con acceso.
