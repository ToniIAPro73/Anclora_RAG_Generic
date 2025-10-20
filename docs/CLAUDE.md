# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## Estado del Proyecto

**Última actualización:** 2025-10-20

**Estado:** ✅ Fase 0 completada (Backend Waitlist + Landing Page). MVP operativo con funcionalidad validada.

**Próximo hito:** Deploy a staging y lanzamiento beta público (Fases 1-4 del plan beta)

---

## Comandos de Desarrollo

### Backend (FastAPI + LlamaIndex + Gemini)

- **Stack completo**: `docker compose -f infra/docker/docker-compose.dev.yml up`
  - Servicios: Postgres (5432), Qdrant (6333), Redis (6379), API (8000), Worker
- **Scripts rápidos**: `.\scripts\powershell\start_dev.ps1` y `.\scripts\powershell\stop_dev.ps1`
- **Solo API** (local): `cd apps/api && uvicorn main:app --reload --port 8000`
  - Requiere `.env` con `GEMINI_API_KEY` (obtener gratis en <https://aistudio.google.com/app/apikey>)
- **Tests**: `cd apps/api && pytest` (33 tests pasando)
- **Python environment**: Usar virtualenv en `apps/api/venv311`

### Frontend

**Dashboard App (Next.js 15):**

- **Install**: `cd apps/web && npm install`
- **Dev server**: `npm run dev` (puerto 3030)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

**Landing Page (Next.js 15):**

- **Install**: `cd apps/landing && npm install`
- **Dev server**: `npm run dev` (puerto 3000 por defecto)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Configuración:** Requiere `.env` con `BACKEND_API_URL` (ej: `http://localhost:8000`)

### Utilidades

- **Backup**: `.\scripts\powershell\backup_repo.ps1 -DumpDocker` antes de refactors mayores
- **Restore**: `.\scripts\powershell\restore_backup.ps1`
- **Init Qdrant**: `.\scripts\powershell\init_qdrant_collection.ps1`
- **Test ingesta**: `.\scripts\powershell\test_ingestion.ps1`
- **Force rebuild**: `.\scripts\powershell\force_rebuild.ps1`

---

## Arquitectura General

### Estructura del Monorepo

```text
apps/
├── api/              # FastAPI backend con pipeline RAG
│   ├── routes/       # Endpoints: auth, ingest, query, health, documents, waitlist
│   ├── rag/          # Pipeline LlamaIndex (ingesta → embeddings → Qdrant)
│   ├── workers/      # RQ background worker (declarado, no usado aún)
│   ├── models/       # SQLAlchemy models + Pydantic (waitlist)
│   ├── database/     # DB clients, sessions, repositories (waitlist)
│   ├── clients/      # Email client (SMTP Hostinger)
│   ├── middleware/   # Rate limiting (slowapi)
│   ├── templates/    # Email templates HTML
│   └── services/     # Lógica de negocio
├── web/              # Next.js 15 dashboard app
│   ├── app/          # App Router (page.tsx = dashboard)
│   ├── components/   # Componentes React reutilizables
│   └── lib/          # Utilities y helpers
├── landing/          # Next.js 15 landing page (beta launch) ✅ NUEVO
│   ├── src/
│   │   ├── app/      # Page + Layout + API routes
│   │   │   └── api/waitlist/route.ts  # Proxy a backend
│   │   └── components/  # Hero, Features, FAQ, EmailCapture
│   ├── package.json
│   └── .env.example
packages/             # Módulos Python compartidos (parsers)
infra/docker/         # Docker Compose para desarrollo local
docs/                 # Documentación del proyecto
scripts/              # PowerShell automation
openspec/             # Metodología de desarrollo basada en specs
```

### Pipeline RAG

**Ingesta** (`apps/api/routes/ingest.py`):

1. Acepta PDF/DOCX/TXT/MD via endpoint `/ingest`
2. Actualmente **síncrona** (bloquea request) - migración a RQ planificada
3. Parsers extraen texto → chunking con `SentenceSplitter` (512 tokens, 80 overlap)
4. Detección de duplicados por hash de contenido
5. Embeddings con `nomic-ai/nomic-embed-text-v1.5` (768 dims, local, CPU)
6. Almacenamiento en Qdrant collection `documents`

**Consulta** (`apps/api/routes/query.py`):

- Usa **Google Gemini LLM** (default `models/gemini-2.0-flash`, configurable via `GEMINI_MODEL`)
- Crea `VectorStoreIndex` y sesión LLM **por request** (sin cache - optimización pendiente)
- Retorna respuesta generada + metadata de fuentes con similarity scores

### Autenticación

- **Estado actual**: `AUTH_BYPASS=true` permite acceso sin restricciones (solo dev)
- **Producción**: Deshabilitar bypass, implementar OAuth2/JWT con roles
- **Importante**: Nunca commitear credenciales reales

### Frontend

- UI settings (theme, language, typography, density) gestionados por `ui-settings-context.tsx`
- Persistencia en `localStorage`
- CSS variables aplicadas dinámicamente

---

## Infraestructura Actual

### Variables de Entorno Críticas

```bash
# LLM
GEMINI_API_KEY=<tu_key>              # Requerido para queries
GEMINI_MODEL=models/gemini-2.0-flash # Modelo LLM

# Embeddings
EMBEDDING_MODEL=nomic-ai/nomic-embed-text-v1.5
EMBED_DIMENSION=768

# Bases de datos
DATABASE_URL=postgresql://...        # Postgres
QDRANT_URL=http://localhost:6333    # Vector DB
REDIS_URL=redis://localhost:6379    # Queue

# Auth (solo dev)
AUTH_BYPASS=true                     # ⚠️ Deshabilitar en producción

# Workers
USE_ASYNC_INGESTION=false           # RQ no activo aún

# Logging
LOG_LEVEL=INFO
```

### Servicios Docker Compose

Definidos en `infra/docker/docker-compose.dev.yml`:

- **postgres** (5432): Metadata y usuarios
- **qdrant** (6333): Vector database
- **redis** (6379): Queue para workers
- **api** (8000): FastAPI backend
- **worker**: RQ worker (declarado, sin uso)

Volúmenes persistentes: `postgres_data`, `qdrant_data`, `redis_data`

---

## Plan de Lanzamiento Beta (Próximo Milestone)

**Estado:** Propuesta aprobada en `openspec/changes/beta-launch-with-landing/`

**Objetivo:** Lanzar versión beta pública con Landing Page para capturar emails en 13 días.

### Decisiones de Infraestructura Confirmadas

**Dominios:**

- Landing: `www.anclora.com` → Vercel (gratis)
- App Beta: `app.anclora.com` → Railway/Fly.io ($5-20/mes)

**Email:**

- SMTP Hostinger (ya contratado, $0 adicional)
- Aliases: `noreply@anclora.com`, `soporte@anclora.com`

**Estrategia:**

- Waitlist con aprobación manual de invitaciones
- Rollout gradual: 10 → 20 → 30 → 50 usuarios en primeras 2 semanas

### Fases de Implementación

- **Fase 0** (2 días): ✅ **COMPLETADA** - Setup waitlist backend + email SMTP + Landing Page
- **Fase 1** (4 días): Landing page completa en Next.js
- **Fase 2** (4 días): Auth real + onboarding + performance
- **Fase 3** (3.5 días): Testing E2E + preparación lanzamiento
- **Fase 4** (1 día): Deploy a producción + primeros 10 usuarios
- **Fase 5** (7 días): Monitoreo + iteración basada en feedback

**Documentos de referencia:**

- Propuesta: `openspec/changes/beta-launch-with-landing/proposal.md`
- Tareas: `openspec/changes/beta-launch-with-landing/tasks.md` (92 tareas detalladas)
- Diseño técnico: `openspec/changes/beta-launch-with-landing/design.md`

---

## Flujos de Trabajo

### Metodología OpenSpec

Este proyecto usa **OpenSpec** para desarrollo basado en especificaciones:

1. **Stage 1 - Creating Changes**: Crear propuesta (`proposal.md`) + tareas (`tasks.md`) + diseño (`design.md`) + spec deltas
2. **Stage 2 - Implementing Changes**: Ejecutar tareas secuencialmente según `tasks.md`
3. **Stage 3 - Archiving Changes**: Mover cambio completado a `changes/archive/` y actualizar specs

**Documentación:** Ver `openspec/AGENTS.md` para instrucciones completas.

### Añadir Nuevo Parser de Documentos

1. Crear módulo en `packages/parsers/` (ej: `pptx_parser.py`)
2. Seguir patrón de parsers existentes (PDF, DOCX)
3. Registrar MIME type en `apps/api/routes/ingest.py`
4. Exportar en `packages/parsers/__init__.py`

### Modificar Pipeline RAG

- Core logic: `apps/api/rag/pipeline.py`
- Settings globales: embedding model, node parser
- Cambiar chunking: modificar `NODE_PARSER` (SentenceSplitter params)
- Cambiar embedding: actualizar `EMBED_MODEL` y asegurar que `EMBED_DIMENSION` coincide

### Añadir Nuevo Endpoint API

1. Crear router en `apps/api/routes/`
2. Importar y registrar en `apps/api/main.py` via `app.include_router()`
3. Usar `Depends` para dependency injection (auth, DB session)

### Actualizar Frontend

- Componentes: PascalCase (`UploadZone.tsx`)
- Styling: Tailwind utility-first (config: `apps/web/tailwind.config.ts`)
- Estado global: Extender `ui-settings-context.tsx` o crear nuevo context

---

## Limitaciones Conocidas & TODOs

### Crítico (Bloquea Beta)

- ✅ ~~No hay landing page~~ → **COMPLETADO** en `apps/landing/`
- ✅ ~~No hay waitlist system~~ → **COMPLETADO** tabla + endpoint + email SMTP
- ⚠️ `AUTH_BYPASS` activo → Deshabilitar y crear auth real con JWT (Fase 2)
- ❌ No hay onboarding → Wizard de 3 pasos para nuevos usuarios (Fase 2)

### Alto (Performance y UX)

- ⚠️ Ingesta síncrona → Migrar a RQ workers con progress tracking
- ⚠️ Query performance → Cache `VectorStoreIndex`, reutilizar LLM client
- ❌ No hay analytics → Implementar tracking de eventos

### Medio (Features)

- ❌ Ingesta avanzada → UI existe (`/ingesta-avanzada`), backend no implementado
- ❌ Tests E2E → Playwright no configurado
- ❌ CI/CD → No hay pipeline automatizado

### Bajo (Operaciones)

- ⚠️ Observabilidad → Logging OK, faltan métricas y tracing
- ❌ Docker API → Contenedor necesita configuración GEMINI_API_KEY
- ❌ Documentación deploy → Runbooks pendientes

---

## Guidelines de Commits

- **Conventional Commits**: `feat(api):`, `fix(web):`, `docs:`, `refactor:`, etc.
- Referenciar issues: `fix(api): normalize toast for accented filenames (#42)`
- **PR checklist**:
  - Summary de cambios
  - Evidencia de tests (capturas, output)
  - Nota sobre migraciones/impacto en datos
  - Verificar que `docker compose` stack arranca

---

## Estrategia de Testing (Planificada)

### Backend

- Framework: `pytest` con fixtures para Qdrant/Postgres mocks
- Ubicación: `apps/api/tests/test_<feature>.py`
- Estado: 33 tests unitarios pasando

### Frontend Testing

- Framework: Playwright para E2E (pendiente configuración)
- Ubicación: Tests junto a componentes en `__tests__/` cuando se introduzcan
- Verificación manual: Siempre probar ingesta + query end-to-end antes de merge

---

## Documentos de Referencia

### Documentación Principal

- `docs/ESTADO_PROYECTO.md` - Estado actual y roadmap
- `docs/DEVELOPMENT_GUIDE.md` - Guidelines de desarrollo (antes AGENTS.md)
- `docs/FASE_0_IMPLEMENTACION.md` - ✅ Documentación completa Fase 0 (Backend + Frontend waitlist)
- `docs/REVISION_LANDING_PAGE.md` - ✅ Revisión técnica de la landing page (scoring 84%)
- `docs/INGESTA-AVANZADA.md` - Specs de ingesta avanzada (no implementado)
- `ESTUDIO_COMPLETO_ANCLORA_RAG.md` - Estudio exhaustivo del proyecto

### OpenSpec

- `openspec/project.md` - Convenciones del proyecto
- `openspec/AGENTS.md` - Instrucciones OpenSpec para AI
- `openspec/changes/beta-launch-with-landing/` - Plan de lanzamiento beta actual

### Scripts de Ayuda

- `scripts/powershell/` - Automatización (backups, init, testing)

---

**Última revisión:** 2025-10-20
**Próxima acción:** Deploy a staging de landing page + backend waitlist (Fase 1-4 del plan beta)
