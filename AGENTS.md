<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

## When to Reference This File

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

## What You'll Learn Here

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines
- Development workflows and best practices

## Maintenance Note

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Repository Guidelines

## Project Structure & Module Organization

### Core Application Modules

- **`apps/api`**: FastAPI RAG service
  - Endpoints in `routes/` (auth, ingest, query, health, documents, **waitlist** ✅)
  - RAG flows in `rag/`
  - Background worker jobs in `workers/`
  - Email client (`clients/email_client.py`) ✅
  - Rate limiting middleware (`middleware/rate_limit.py`) ✅
- **`apps/web`**: Next.js 15 dashboard application
  - UI components in `app/`
  - Shared components under `components/`
  - Tailwind configuration in `tailwind.config.ts`
- **`apps/landing`**: ✅ **NUEVO** - Next.js 15 landing page (beta launch)
  - Landing page components: Hero, Features, FAQ, EmailCapture, ProblemSolution
  - API route proxy to backend (`/api/waitlist`)
  - Score técnico: 84/100 (ver `docs/REVISION_LANDING_PAGE.md`)

### Shared Libraries

- **`packages/`**: Reusable Python libraries
  - `parsers/`: Document parsing utilities
  - `rag-core/`: Core RAG functionality

### Infrastructure & DevOps

- **`infra/docker`**: Docker Compose configurations
  - Postgres, Redis, Qdrant, Ollama integration
  - Development and production environments

### Development Support

- **`scripts/`**: Automation and utility scripts
- **`tests/`**: Unit and integration test suites
- **`testsprite_tests/`**: End-to-end regression tests
- **`openspec/`**: Spec-driven change management system

## Build, Test & Development Commands

### Full Stack Development

- `docker compose -f infra/docker/docker-compose.dev.yml up --build`: Bootstrap full stack (add `--detach` for background)
- `docker compose -f infra/docker/docker-compose.prod.yml up --build`: Start production environment

### API Development

- `cd apps/api && uvicorn main:app --reload`: Run API locally; load `.env` with RAG credentials
- `cd apps/api && python scripts/init_db.py`: Initialize database schema
- `cd apps/api && python -m pytest`: Run test suite

### Frontend Development

**Dashboard App (apps/web):**
- `cd apps/web && npm install && npm run dev`: Start client on port 3030
- `cd apps/web && npm run build`: Production smoke tests
- `cd apps/web && npm run lint`: Enforce ESLint, Tailwind, and TypeScript rules

**Landing Page (apps/landing):** ✅ NUEVO
- `cd apps/landing && npm install && npm run dev`: Start landing page on port 3000
- `cd apps/landing && npm run build`: Production build
- `cd apps/landing && npm run lint`: Enforce ESLint rules
- **Requires:** `.env` with `BACKEND_API_URL` (e.g., `http://localhost:8000`)

### System Validation

- `python scripts/verify_system.py`: Validate Docker, Ollama models, and Qdrant indexes
- `scripts/backup_qdrant.sh`: Backup vector database before schema changes

## Coding Style & Naming Conventions

### Language-Specific Guidelines

- **Python**: PEP 8, 4 spaces, snake_case modules, FastAPI dependencies via `Depends`
- **TypeScript/React**: Components PascalCase, hooks/utilities camelCase; keep Tailwind classes inline
- **General**: Prefer configuration files or env vars over inline secrets; share tokens via `apps/web/lib/`

### Best Practices

- Use descriptive variable and function names that clearly indicate their purpose
- Follow single responsibility principle for functions and classes
- Maintain consistent code formatting across the entire codebase
- Add type hints for better code documentation and IDE support

## Testing Guidelines

- Run `pytest` from `apps/api` for backend unit and integration tests; mock third-party services by default
- Frontend tests live in `apps/web/__tests__/` using React Testing Library; migrate stable `testsprite_tests/` scenarios
- Name tests `test_<feature>.py` or `<Component>.test.tsx`; keep coverage focused on approved behaviors

### Testing Best Practices

- Write tests that are isolated, repeatable, and fast
- Use descriptive test names that explain what behavior is being tested
- Mock external dependencies to ensure tests run reliably
- Test both happy path and edge cases
- Maintain test data fixtures for consistent testing across environments

## Commit & Pull Request Guidelines

- Follow concise imperative history; prefer Conventional Commit prefixes (`feat(api): ...`, `fix(web): ...`)
- Each PR needs a clear summary, impact radius, test proof (commands or rationale), linked task, and UX evidence (screenshots or curl) for user-facing changes
- Request relevant module owners as reviewers and avoid unrelated changes in the same PR

### PR Requirements

- **Summary**: Clear description of changes and their purpose
- **Impact Assessment**: What parts of the system are affected
- **Testing Evidence**: Commands run or rationale for validation
- **Linked Issues**: Reference to related tasks or issues
- **Visual Proof**: Screenshots for UI changes, curl commands for API changes

## Security & Configuration Tips

- Copy `.env.example` for local setups; never commit credentials
- Run `scripts/backup_qdrant.sh` before schema edits; reset data with `docker compose down -v`
- Keep `AUTH_BYPASS=true` strictly local and remove it before sharing environments

### Additional Security Considerations

- Use strong, unique passwords for all service accounts
- Regularly rotate API keys and tokens
- Monitor access logs for suspicious activity
- Keep dependencies updated to avoid known vulnerabilities
- Use HTTPS for all communications in production

### Environment Management

- Use separate environments for development, staging, and production
- Never use production data in development environments
- Implement proper logging and monitoring for all services
- Document any environment-specific configurations
