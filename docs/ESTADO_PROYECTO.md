# Estado Actual del Proyecto Anclora RAG

## 1. Resumen ejecutivo

- **Ámbito**: Monorepo que unifica backend RAG (FastAPI + LlamaIndex + Qdrant + Gemini) y frontend Next.js 15 / TailwindCSS. Infraestructura Docker Compose (Postgres, Redis, Qdrant, API, Worker) más scripts de mantenimiento.
- **Estado**: MVP operativo. Permite ingestar PDF/DOCX/TXT/MD y consultar resultados desde el dashboard usando Google Gemini como LLM. Personalización visual (idioma, tema, branding) completada. Embeddings locales con modelo gratuito nomic-embed-text. Tests unitarios funcionando (33 tests pasando).
- **Prioridades**: configurar contenedor Docker API con GEMINI_API_KEY, migrar la ingesta a colas (RQ), completar "Ingesta Avanzada", optimizar consultas con caché y establecer CI/CD.

## 2. Arquitectura actual

### 2.1 Organización del repositorio

apps
/
├── apps/
│   ├── api/        # FastAPI, routers, pipeline RAG, worker RQ
│   └── web/        # Next.js 15 (App Router), TailwindCSS, componentes UI
├── infra/docker/  # docker-compose.dev.yml, volúmenes persistentes
├── packages/      # Parsers y librerías compartidas
├── scripts/       # Powershell (respaldos, verificación entorno)
├── docs/          # Documentación clave (INGESTA-AVANZADA, AGENTS)
└── tests/         # Recursos base para pruebas (sin suites)

```text

### 2.2 Backend (apps/api)

- Routers activos: `auth`, `ingest`, `query`, `health`, `documents`. `batch.py` existe pero está deshabilitado temporalmente.
- Pipeline RAG (`rag/pipeline.py`): documentos → nodos → embeddings `nomic-ai/nomic-embed-text-v1.5` (768 dims, local/gratuito) → colección Qdrant. Patrón defensivo para creación de colección y soporte MIME `application/octet-stream`. Detección de duplicados por hash de contenido.
- Consultas (`routes/query.py`): Usa **Google Gemini** (`GEMINI_MODEL`, por defecto `models/gemini-2.0-flash`) y `VectorStoreIndex` en cada request; `AUTH_BYPASS` suministra usuario admin ficticio.
- Middleware: `CorrelationIdMiddleware` para tracking de requests, logging estructurado configurado.
- Worker RQ declarado en Docker pero sin uso (ingesta actual síncrona).
- Tests: 33 tests unitarios pasando (pytest).

### 2.3 Frontend (apps/web)

- Dashboard principal (`app/page.tsx`) con tarjetas de ingesta/consulta, chat interactivo y dropzone.
- Configuración (`app/configuracion/page.tsx`): idioma, tema, acentos validados, tipografía, densidad, byline “by Anclora”.
- Vista "Ingesta Avanzada" (`app/ingesta-avanzada/page.tsx`): documentación guiada de capacidades Pro (sin backend).
- Contexto global (`ui-settings-context.tsx`): persistencia de preferencias (localStorage) y control CSS variable.

### 2.4 Infraestructura

- `docker-compose.dev.yml`: Postgres 16 (5432), Qdrant 1.7 (6333), Redis 7 (6379), API (8000), Worker. Volúmenes para datos y cache HF. Python 3.11-slim con PyTorch CPU-only.
- `.env`: credenciales (GEMINI_API_KEY requerido), modelos, `AUTH_BYPASS=true` (solo dev).
- Scripts PowerShell: `start_dev.ps1`, `stop_dev.ps1`, `backup_repo.ps1`, `restore_backup.ps1`, `init_qdrant_collection.ps1`, `test_ingestion.ps1`, `force_rebuild.ps1`.

## 3. Estado funcional

| Área | Estado | Comentario |
|------|--------|------------|
| Ingesta básica | ✅ | `/ingest` procesa PDF/DOCX/TXT/MD; detección de duplicados; mensajes normalizados. |
| Consulta | ✅ | Chat activo con Gemini, muestra fuentes con scores; latencia por instancias LLM/Index ad hoc. |
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

## 7. Próximos pasos inmediatos

1. Auditar `.env`, documentar uso seguro y desactivar bypass fuera de dev.
2. Planificar sprint de ingesta asíncrona con historias backend/UI.
3. Derivar features de `docs/INGESTA-AVANZADA.md` para la versión Pro.
4. Definir estrategia de pruebas + pipeline CI mínimo.
5. Documentar runbooks y mantener README/AGENTS/ESTADO_PROYECTO sincronizados.

---
**Documento generado**: 13/10/2025 · Equipo Anclora
