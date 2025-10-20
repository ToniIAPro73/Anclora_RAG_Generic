# Estado Actual del Proyecto Anclora RAG

**Última actualización:** 2025-10-20

## 1. Resumen ejecutivo

- **Ámbito**: Monorepo que unifica backend RAG (FastAPI + LlamaIndex + Qdrant + Gemini), frontend dashboard (Next.js 15), y landing page beta. Infraestructura Docker Compose (Postgres, Redis, Qdrant, API, Worker) más scripts de mantenimiento.
- **Estado**: ✅ **Fase 0 completada** - MVP operativo + Waitlist Backend + Landing Page. Sistema permite ingestar PDF/DOCX/TXT/MD y consultar usando Google Gemini. Sistema de waitlist con email SMTP (Hostinger) operativo. Tests unitarios funcionando (33 tests pasando).
- **Próximo Hito**: **Deploy a Staging y Lanzamiento Beta Público** (Fases 1-4 del plan)
- **Prioridades Inmediatas**:
  1. ✅ ~~Plan de lanzamiento beta aprobado (OpenSpec)~~
  2. ✅ ~~Implementar waitlist system + Landing Page~~ **COMPLETADO**
  3. 🔄 Deploy a staging (Vercel landing + Railway/Fly.io backend)
  4. 🔄 Autenticación real (deshabilitar AUTH_BYPASS)
  5. 🔄 Onboarding wizard para nuevos usuarios
  6. 🔄 Performance optimization (cache + async ingestion)

## 2. Arquitectura actual

### 2.1 Organización del repositorio

```text
apps/
├── api/           # FastAPI, routers (waitlist ✅), pipeline RAG, worker RQ
├── web/           # Next.js 15 (App Router), Dashboard principal
├── landing/       # ✅ NUEVO - Next.js 15, Landing page beta launch
infra/docker/      # docker-compose.dev.yml, volúmenes persistentes
packages/          # Parsers y librerías compartidas
scripts/           # Powershell (respaldos, verificación entorno)
docs/              # Documentación clave (FASE_0_IMPLEMENTACION ✅, REVISION_LANDING_PAGE ✅)
openspec/          # Metodología spec-driven, plan beta launch
tests/             # Recursos base para pruebas (sin suites)
```

### 2.2 Backend (apps/api)

- Routers activos: `auth`, `ingest`, `query`, `health`, `documents`, `waitlist` ✅. `batch.py` existe pero está deshabilitado temporalmente.
- Pipeline RAG (`rag/pipeline.py`): documentos → nodos → embeddings `nomic-ai/nomic-embed-text-v1.5` (768 dims, local/gratuito) → colección Qdrant. Patrón defensivo para creación de colección y soporte MIME `application/octet-stream`. Detección de duplicados por hash de contenido.
- Consultas (`routes/query.py`): Usa **Google Gemini** (`GEMINI_MODEL`, por defecto `models/gemini-2.0-flash`) y `VectorStoreIndex` en cada request; `AUTH_BYPASS` suministra usuario admin ficticio.
- Middleware: `CorrelationIdMiddleware` para tracking, `slowapi` para rate limiting ✅, logging estructurado configurado.
- Email SMTP ✅: Cliente configurado con Hostinger (`clients/email_client.py`), templates HTML profesionales.
- Database ✅: Tablas waitlist + analytics_events en PostgreSQL con índices optimizados.
- Worker RQ declarado en Docker pero sin uso (ingesta actual síncrona).
- Tests: 33 tests unitarios pasando (pytest).

### 2.3 Frontend

**Dashboard App (apps/web):**
- Dashboard principal (`app/page.tsx`) con tarjetas de ingesta/consulta, chat interactivo y dropzone.
- Configuración (`app/configuracion/page.tsx`): idioma, tema, acentos validados, tipografía, densidad, byline "by Anclora".
- Vista "Ingesta Avanzada" (`app/ingesta-avanzada/page.tsx`): documentación guiada de capacidades Pro (sin backend).
- Contexto global (`ui-settings-context.tsx`): persistencia de preferencias (localStorage) y control CSS variable.

**Landing Page (apps/landing) ✅ NUEVO:**
- Framework: Next.js 15.5.6, React 19.1.0, Tailwind CSS 4
- Componentes: Hero, ProblemSolution, Features (4), EmailCapture, FAQ (10 preguntas)
- Integración: API route proxy (`/api/waitlist`) hacia backend FastAPI
- Validación: Email regex + HTML5 + manejo de errores 400/409/429/500
- UX: Estados loading/success/error, muestra posición en waitlist
- SEO: Metadata completa, Google Analytics 4 condicional
- Score técnico: 84/100 (ver `docs/REVISION_LANDING_PAGE.md`)

### 2.4 Infraestructura

- `docker-compose.dev.yml`: Postgres 16 (5432), Qdrant 1.7 (6333), Redis 7 (6379), API (8000), Worker. Volúmenes para datos y cache HF. Python 3.11-slim con PyTorch CPU-only.
- `.env`: credenciales (GEMINI_API_KEY requerido), modelos, `AUTH_BYPASS=true` (solo dev).
- Scripts PowerShell: `start_dev.ps1`, `stop_dev.ps1`, `backup_repo.ps1`, `restore_backup.ps1`, `init_qdrant_collection.ps1`, `test_ingestion.ps1`, `force_rebuild.ps1`.

## 3. Estado funcional

| Área | Estado | Comentario |
|------|--------|------------|
| Ingesta básica | ✅ | `/ingest` procesa PDF/DOCX/TXT/MD; detección de duplicados; mensajes normalizados. |
| Consulta | ✅ | Chat activo con Gemini, muestra fuentes con scores; latencia por instancias LLM/Index ad hoc. |
| Waitlist System | ✅ | Backend + Landing Page completos; email SMTP; rate limiting; PostgreSQL. |
| Landing Page | ✅ | Next.js 15 con 5 secciones; integración completa backend; score 84/100. |
| Autenticación | ⚠️ | `AUTH_BYPASS` habilitado; sin roles reales. |
| Ingesta avanzada | ❌ | Sólo maquetada. |
| Worker RQ | ⚠️ | Contenedor en marcha sin jobs. |
| Personalización UI | ✅ | Idioma/tema/acento/tipografía/densidad persistidos; temas claro/oscuro coherentes. |
| Tests backend | ✅ | 33 tests unitarios pasando (pytest). |
| CI/CD | ❌ | No existe pipeline automatizado. |
| Observabilidad | ⚠️ | Logging estructurado implementado; sin métricas/tracing. |

## 4. Hallazgos clave

1. **Migración a Gemini**: Backend local funciona con Google Gemini; contenedor Docker necesita configuración de GEMINI_API_KEY.
2. **Seguridad**: Autenticación ficticia → bloquear acceso requiere implementación real.
3. **Ingesta bloqueante**: sin asíncrono ni feedback de progreso; RQ ocioso.
4. **Latencia del chat**: reconstrucción de index y sesiones Gemini por request.
5. **Ingesta avanzada**: brecha entre documentación y código.
6. **Tests backend**: ✅ 33 tests unitarios funcionando correctamente.
7. **Observabilidad**: logging estructurado implementado; faltan métricas y tracing.
8. **Gestión de modelos**: sin versionado ni políticas de cambio.

## 5. Plan de mejora recomendado

1. **Autenticación real**: implementar OAuth2/JWT, scopes, refresco opcional; deshabilitar bypass salvo dev.
2. **Ingesta asíncrona**: encolar jobs RQ, endpoint/WebSocket de progreso, historial en UI.
3. **Completar ingesta avanzada**: desarrollar batch manager, import GitHub y fuentes estructuradas + flujo Pro.
4. **Optimizar consultas**: cachear `VectorStoreIndex`, reusar clientes, introducir streaming y selección de modelo.
5. **QA/CI**: lint (`eslint`, `ruff`), pytest, Playwright; pipeline GitHub Actions.
6. **Observabilidad**: métricas (Prometheus), logging estructurado, dashboards básicos.
7. **Experiencia**: historial de documentos, toasts de errores, accesibilidad.
8. **Operaciones**: políticas de backups, despliegue productivo (reverse proxy, TLS, escalado).

## 6. Funcionalidades pendientes

- Ingesta avanzada (batches, GitHub, structured).
- Integración efectiva con RQ (jobs, monitor).
- Autenticación/roles reales.
- Historial/analítica de ingestas y consultas.
- Test suites, CI/CD, documentación de despliegue.

## 7. Plan de Lanzamiento Beta (En Progreso)

### 7.1 Estado del Plan

**Propuesta Aprobada:** `openspec/changes/beta-launch-with-landing/`

**Análisis de Mercado (2025):**
- Mercado RAG: $1.2-3.8B (2025) → $165B en 2034 (CAGR 45.8%)
- Adopción: 70.5% grandes empresas
- Momento ideal para lanzar: mercado en explosión

**Estrategia de Posicionamiento:**
- **vs NotebookLM:** Resuelve problema #1 (citas incorrectas) + sin límite 500k palabras
- **vs RAG tradicionales:** Listo en 5 minutos, sin necesidad de ser MLops engineer
- **vs Búsqueda empresarial:** Inteligencia contextual, respuestas en lugar de solo documentos

**Diferenciadores REALES del MVP (enfatizar en landing):**
- ✅ Citas verificables (similarity scores + metadata: filename, page, score)
- ✅ Multilenguaje ES/EN nativo
- ✅ Sin límites artificiales de palabras
- ✅ Privacidad total (self-hostable, no depende de Google)
- ✅ Fácil de usar (drag & drop)

**Features NO prometer en beta (roadmap futuro):**
- ❌ Colaboración tiempo real (roadmap v1.1)
- ❌ Procesamiento imágenes/tablas (roadmap v1.2)
- ❌ 20+ integraciones (roadmap v1.3)
- ❌ Graph RAG (roadmap v2.0)

**Estrategia:** Honestidad + roadmap claro = confianza de early adopters

**Decisiones de Infraestructura Confirmadas:**
- ✅ Landing separada: `www.anclora.com` → Vercel (gratis)
- ✅ App beta: `app.anclora.com` → Railway/Fly.io
- ✅ Email: Hostinger SMTP (ya contratado, $0 adicional)
- ✅ Estrategia: Waitlist con aprobación manual de invitaciones

### 7.2 Timeline de Implementación (9 días, 144.5h estimadas)

| Fase | Días | Objetivo | Estado |
|------|------|----------|--------|
| **Fase 0** | 1-2 | Setup waitlist backend + SMTP + Landing | ✅ **COMPLETADA** |
| **Fase 1** | 3-5 | Mejoras landing + SEO + Analytics | 🔄 Próximo |
| **Fase 2** | 6-9 | Auth real + onboarding + performance | ⏳ Pendiente |
| **Fase 3** | 10-12 | Testing E2E + preparación | ⏳ Pendiente |
| **Fase 4** | 13 | Deploy + primeros 10 usuarios | ⏳ Pendiente |

**Nota:** Fase 5 (Post-Lanzamiento) eliminada del scope inicial. Se manejará como iteración continua post-deploy.

### 7.3 Métricas de Éxito Beta

**Lanzamiento Exitoso (Día 13):**
- ✅ Landing page live y funcional
- ✅ 10+ emails capturados en primeras 48h
- ✅ Aplicación beta accesible con 0 errores críticos
- ✅ Primeros 5 usuarios completan onboarding

**Beta Exitosa (Día 30):**
- ✅ 100+ emails en waitlist
- ✅ 50+ usuarios beta invitados
- ✅ 30+ usuarios activos (query en últimos 7 días)
- ✅ NPS >40
- ✅ 0 downtime no planificado

### 7.4 Documentos de Referencia

- **Estrategia MVP**: `landing-resources/copy/MVP_STRATEGY.md` (basado en análisis mercado 2025)
- **Propuesta completa**: `openspec/changes/beta-launch-with-landing/proposal.md`
- **Tareas detalladas**: `openspec/changes/beta-launch-with-landing/tasks.md`
- **Diseño técnico**: `openspec/changes/beta-launch-with-landing/design.md`
- **Spec deltas**: `openspec/changes/beta-launch-with-landing/specs/`
- **Maqueta landing**: `landing-resources/assets/index.html`
- **Competitive matrix**: `landing-resources/assets/anclora_rag_competitive_matrix.csv`

## 8. Próximos pasos inmediatos

1. ✅ **Aprobar plan de lanzamiento beta** (completado)
2. 🔄 **Fase 0 Día 1**: Crear migración DB tabla `waitlist` (T001)
3. 🔄 **Fase 0 Día 1**: Implementar endpoint POST /api/waitlist (T003)
4. 🔄 **Fase 0 Día 1**: Configurar SMTP Hostinger (T006)
5. 🔄 **Fase 0 Día 2**: Setup estructura apps/landing/ (T010)

---
**Documento generado**: 13/10/2025 · Equipo Anclora
