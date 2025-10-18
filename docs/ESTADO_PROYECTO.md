# Estado Actual del Proyecto Anclora RAG

## 1. Resumen ejecutivo

- **Ámbito**: Monorepo que unifica backend RAG (FastAPI + LlamaIndex + Qdrant + Ollama) y frontend Next.js 15 / TailwindCSS. Infraestructura Docker Compose (Postgres, Redis, Qdrant, Ollama, API, Worker) más scripts de mantenimiento.
- **Estado**: MVP operativo. Permite ingestar PDF/DOCX/TXT/MD y consultar resultados desde el dashboard. Personalización visual (idioma, tema, branding) completada. Persisten atajos técnicos (auth bypass, ingesta síncrona, falta de tests/observabilidad).
- **Prioridades**: endurecer autenticación, migrar la ingesta a colas (RQ), completar “Ingesta Avanzada”, optimizar consultas y establecer QA/CI.

## 2. Arquitectura actual

### 2.1 Organización del repositorio

ag
/
├── apps/
│   ├── api/        # FastAPI, routers, pipeline RAG, worker RQ
│   └── web/        # Next.js 15 (App Router), TailwindCSS, componentes UI
├── infra/docker/  # docker-compose.dev.yml, volúmenes persistentes
├── packages/      # Parsers y librerías compartidas
├── scripts/       # Powershell (respaldos, verificación entorno)
├── docs/          # Documentación clave (INGESTA-AVANZADA, AGENTS)
└── tests/         # Recursos base para pruebas (sin suites)

```

### 2.2 Backend (apps/api)

- Routers activos: `auth`, `ingest`, `query`, `health`. `batch.py` existe pero no está montado en `main.py`.
- Pipeline RAG (`rag/pipeline.py`): documentos → nodos → embeddings `nomic-ai/nomic-embed-text-v1.5` → colección Qdrant (768 dims). Patrón defensivo para creación de colección y soporte MIME `application/octet-stream`.
- Consultas (`routes/query.py`): Instancia Ollama (`OLLAMA_MODEL`, por defecto `llama3.2:1b`) y `VectorStoreIndex` en cada request; `AUTH_BYPASS` suministra usuario admin ficticio.
- Worker RQ declarado en Docker pero sin uso (ingesta actual síncrona).

### 2.3 Frontend (apps/web)

- Dashboard principal (`app/page.tsx`) con tarjetas de ingesta/consulta, chat interactivo y dropzone.
- Configuración (`app/configuracion/page.tsx`): idioma, tema, acentos validados, tipografía, densidad, byline “by Anclora”.
- Vista "Ingesta Avanzada" (`app/ingesta-avanzada/page.tsx`): documentación guiada de capacidades Pro (sin backend).
- Contexto global (`ui-settings-context.tsx`): persistencia de preferencias (localStorage) y control CSS variable.

### 2.4 Infraestructura

- `docker-compose.dev.yml`: Postgres 16, Qdrant 1.7, Redis 7, Ollama latest, API, Worker. Volúmenes para datos y cache HF.
- `.env`: credenciales, modelos, `AUTH_BYPASS=true` (solo dev), rutas temporales.
- Scripts: `backup_repo.ps1` (dumps + zip + subida opcional a Drive), `verify_system.py`, etc.

## 3. Estado funcional

| Área | Estado | Comentario |
|------|--------|------------|
| Ingesta básica | ✅ | `/ingest` procesa PDF/DOCX/TXT/MD; mensaje de éxito normalizado para nombres con acentos. |
| Consulta | ✅ | Chat activo, muestra fuentes; latencia por instancias LLM/Index ad hoc. |
| Autenticación | ⚠️ | `AUTH_BYPASS` habilitado; sin roles reales. |
| Ingesta avanzada | ❌ | Sólo maquetada. |
| Worker RQ | ⚠️ | Contenedor en marcha sin jobs. |
| Personalización UI | ✅ | Idioma/tema/acento/tipografía/densidad persistidos; temas claro/oscuro coherentes. |
| Tests/CI | ❌ | No existen suites ni pipelines. |
| Observabilidad | ⚠️ | Logging básico; sin métricas/tracing. |

## 4. Hallazgos clave

1. **Seguridad**: Autenticación ficticia → bloquear acceso requiere implementación real.
2. **Ingesta bloqueante**: sin asíncrono ni feedback de progreso; RQ ocioso.
3. **Latencia del chat**: reconstrucción de index y sesiones Ollama por request.
4. **Ingesta avanzada**: brecha entre documentación y código.
5. **Calidad/CI**: sin lint/tests, riesgo de regresiones.
6. **Observabilidad**: ausencia de métricas y logs estructurados.
7. **Gestión de modelos**: sin versionado ni políticas de cambio.

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
