Basándome en el reporte de testing y el estado actual del proyecto, aquí están las
  funcionalidades pendientes en orden de prioridad:

  🔴 Prioridad ALTA (Siguiente Sprint)

  1. Re-validación con TestSprite

  - Re-ejecutar la suite completa de tests para confirmar que los fixes funcionan
  - Objetivo: pasar de 45% a >80% de éxito
  - Esto validará que las correcciones resolvieron los problemas

  2. Tests de Integración (pytest)

  Ubicación: apps/api/tests/
  - Tests para endpoint /ingest (upload PDF, DOCX, TXT, MD)
  - Tests para endpoint /query (validar formato de respuesta)
  - Tests para RAG pipeline completo (ingesta → embeddings → Qdrant → query)
  - Mocks para Qdrant y Ollama
  - Impacto: Prevenir regresiones en futuras modificaciones

  3. Logging Estructurado

  Ubicación: Todos los endpoints y workers
  - Implementar correlation IDs para tracing de requests
  - Logs en formato JSON estructurado
  - Niveles apropiados (DEBUG en dev, INFO en prod)
  - Stack traces en errores
  - Impacto: Debugging y troubleshooting mucho más rápido

  🟡 Prioridad MEDIA (1-2 Semanas)

  4. Health Checks Comprehensivos

  Ubicación: apps/api/routes/health.py
  GET /health → {
    "status": "healthy",
    "dependencies": {
      "qdrant": "ok",
      "ollama": "ok",
      "postgres": "ok",
      "redis": "ok"
    }
  }
  - Verificar conectividad de cada servicio
  - Retornar HTTP 503 si algún servicio falla
  - Impacto: Monitoreo y alertas en producción

  5. Batch Processing (si requerido por negocio)

  Archivos a crear:
  - apps/api/database/postgres_client.py - Función get_db()
  - apps/api/database/batch_manager.py - Gestión de batch jobs
  - Re-habilitar apps/api/routes/batch.py en main.py

  Funcionalidades:
  - Subir múltiples documentos
  - Importar desde GitHub repos
  - Procesar fuentes estructuradas (CSV, JSON)
  - UI en /ingesta-avanzada ya existe

  Nota: El reporte menciona que esto está deshabilitado. ¿Es necesario para el MVP o puede esperar?    

  6. Optimización de Performance

  Problema actual: Index y LLM se recrean en cada request
  Solución:
  - Cache de VectorStoreIndex con TTL
  - Reutilizar sesión de Ollama LLM
  - Connection pooling para Qdrant
  - Impacto: Reducir latencia de queries de ~2-3s a <1s

  🟢 Prioridad BAJA (Backlog)

  7. Documentación API (OpenAPI/Swagger)

  - Completar descripciones de endpoints
  - Ejemplos de requests/responses
  - Códigos de error documentados
  - Ya tiene base FastAPI, solo falta completar

  8. Streaming de Respuestas LLM

  - Implementar Server-Sent Events (SSE)
  - Retornar respuesta del LLM en chunks
  - Impacto: Mejor UX, usuario ve respuesta generándose

  9. Rate Limiting

  - Limitar requests por IP/usuario
  - Prevenir abuso del sistema
  - Usar Redis para contadores

  10. Observabilidad Completa

  - Prometheus metrics
  - Grafana dashboards
  - Alertas para errores críticos
  - Tracing distribuido (Jaeger/OpenTelemetry)

  11. Autenticación Completa para Producción

  - Deshabilitar AUTH_BYPASS=false
  - Implementar refresh tokens
  - Password reset flow
  - Email verification
  - Nota: Actualmente funciona con bypass, suficiente para desarrollo

  ---
  📋 Mi Recomendación de Roadmap

  Esta semana:
  1. Re-ejecutar TestSprite (1h)
  2. Implementar tests pytest básicos (4-6h)
  3. Logging estructurado (2-3h)

  Próxima semana:
  4. Health checks comprehensivos (2h)
  5. Optimización de cache/performance (3-4h)

  Después (según prioridad de negocio):
  - Batch processing si es requerido
  - Streaming de respuestas para mejor UX
  - Observabilidad completa antes de producción