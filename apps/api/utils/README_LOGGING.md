# Logging Estructurado - Anclora RAG API

## Descripción

Sistema de logging estructurado con correlation IDs para tracing de requests y debugging simplificado.

## Características

- ✅ **Correlation IDs**: Cada request tiene un ID único para tracing end-to-end
- ✅ **Logging Estructurado**: Logs en formato JSON o human-readable
- ✅ **Context Variables**: Correlation ID se propaga automáticamente en async contexts
- ✅ **Middleware Integration**: Logging automático de requests/responses
- ✅ **Flexible Configuration**: Niveles de log y formatos configurables por environment

## Uso Básico

### En endpoints y módulos

```python
from utils.logging_config import get_structured_logger

logger = get_structured_logger(__name__, module="my_module")

# Log simple
logger.info("Processing document")

# Log con campos adicionales
logger.info(
    "Document processed",
    filename="test.pdf",
    chunks=5,
    duration_ms=234.5
)

# Log de error con exception
try:
    process_document()
except Exception as exc:
    logger.error(
        "Failed to process document",
        filename="test.pdf",
        error=str(exc),
        exc_info=True  # Incluye stack trace
    )
```

## Configuración

### Variables de Entorno

```bash
# Nivel de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO

# Formato de logs (true para JSON, false para human-readable)
USE_JSON_LOGS=false
```

### En main.py

```python
from utils.logging_config import setup_logging

# Configurar logging al inicio de la aplicación
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
USE_JSON_LOGS = os.getenv("USE_JSON_LOGS", "false").lower() == "true"
setup_logging(level=LOG_LEVEL, use_json=USE_JSON_LOGS)
```

## Middleware de Correlation ID

El middleware automáticamente:

1. Extrae o genera un correlation ID para cada request
2. Lo inyecta en el contexto de logging
3. Lo añade a los response headers
4. Logea el inicio y fin de cada request con timing

### Configuración en FastAPI

```python
from middleware import CorrelationIdMiddleware

app = FastAPI()
app.add_middleware(CorrelationIdMiddleware)  # Debe ser el primer middleware
```

### Headers

El middleware soporta estos headers (en orden de prioridad):

- `X-Correlation-ID`
- `X-Request-ID`

Si no se proporciona ninguno, se genera un UUID automáticamente.

## Formatos de Output

### Human-Readable (Desarrollo)

```
2025-10-17 14:23:45 | INFO     | a1b2c3d4-... | routes.ingest:ingest_document:40 | Starting document ingestion
```

Formato: `timestamp | level | correlation_id | logger:function:line | message`

### JSON Estructurado (Producción)

```json
{
  "timestamp": "2025-10-17T14:23:45.123Z",
  "level": "INFO",
  "logger": "routes.ingest",
  "message": "Starting document ingestion",
  "correlation_id": "a1b2c3d4-...",
  "module": "ingest",
  "function": "ingest_document",
  "line": 40,
  "filename": "test.pdf",
  "size_kb": 125.4
}
```

## Ejemplos de Uso

### Logging en Endpoints

```python
from utils.logging_config import get_structured_logger

logger = get_structured_logger(__name__, service="api")

@router.post("/ingest")
async def ingest_document(file: UploadFile):
    filename = file.filename
    file_size_kb = len(await file.read()) / 1024

    logger.info(
        "Starting document ingestion",
        filename=filename,
        size_kb=round(file_size_kb, 2)
    )

    try:
        result = process_document(file)

        logger.info(
            "Document ingestion completed",
            filename=filename,
            chunks=result["chunks"],
            status=result["status"]
        )

        return result

    except Exception as exc:
        logger.error(
            "Document ingestion failed",
            filename=filename,
            error=str(exc),
            exc_info=True
        )
        raise
```

### Logging en Workers

```python
from utils.logging_config import get_structured_logger

logger = get_structured_logger(__name__, component="worker")

def process_single_document(file_path: str, filename: str):
    logger.debug("Starting document parsing", filename=filename, path=file_path)

    text = parse_document(file_path)

    logger.debug(
        "Document parsed",
        filename=filename,
        text_length=len(text)
    )

    chunk_count = index_text(filename, text)

    logger.info(
        "Document indexed",
        filename=filename,
        chunks=chunk_count
    )

    return {"filename": filename, "chunks": chunk_count}
```

### Obtener Correlation ID Manualmente

```python
from utils.logging_config import get_correlation_id

def some_function():
    correlation_id = get_correlation_id()
    print(f"Current request ID: {correlation_id}")
```

## Niveles de Log Recomendados

### DEBUG
- Detalles de implementación
- Valores de variables intermedios
- Rutas de archivos temporales

```python
logger.debug("Processing document", temp_path=str(temp_path))
```

### INFO
- Operaciones principales completadas
- Inicio/fin de procesos importantes
- Métricas y estadísticas

```python
logger.info("Document indexed", filename=filename, chunks=5)
```

### WARNING
- Situaciones recuperables
- Validaciones fallidas
- Deprecations

```python
logger.warning("Empty file upload attempted", filename=filename)
```

### ERROR
- Errores que requieren atención
- Fallos en operaciones críticas
- Incluir `exc_info=True` para stack traces

```python
logger.error("Failed to index document", error=str(exc), exc_info=True)
```

### CRITICAL
- Errores que impiden el funcionamiento del sistema
- Fallos de dependencias críticas

```python
logger.critical("Cannot connect to Qdrant", url=qdrant_url, exc_info=True)
```

## Búsqueda en Logs

### Por Correlation ID

```bash
# Buscar todos los logs de un request específico
grep "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6" app.log

# En producción con JSON logs
jq 'select(.correlation_id == "a1b2c3d4-...")' app.log
```

### Por Filename

```bash
# Buscar todos los logs relacionados con un archivo
jq 'select(.filename == "test.pdf")' app.log
```

### Por Error

```bash
# Buscar todos los errores
jq 'select(.level == "ERROR")' app.log
```

## Best Practices

### ✅ DO

- Usar campos estructurados en lugar de interpolación
  ```python
  # Correcto
  logger.info("Processing document", filename=filename, size=size)

  # Incorrecto
  logger.info(f"Processing document {filename} with size {size}")
  ```

- Incluir contexto relevante en cada log
- Usar niveles de log apropiados
- Incluir `exc_info=True` en logs de error

### ❌ DON'T

- No loggear información sensible (passwords, tokens, PII)
- No hacer logging excesivo en loops (usar sampling)
- No usar `print()` en lugar de logger
- No incluir objetos complejos (usar `str()` o extraer campos específicos)

## Troubleshooting

### Los logs no muestran correlation ID

Verifica que el middleware esté configurado:

```python
app.add_middleware(CorrelationIdMiddleware)
```

### Logs duplicados

Asegúrate de llamar `setup_logging()` solo una vez, al inicio de la aplicación.

### Stack traces no aparecen

Incluye `exc_info=True` en el log de error:

```python
logger.error("Error message", exc_info=True)
```

## Integración con Herramientas

### Grafana + Loki

```yaml
# promtail config
scrape_configs:
  - job_name: anclora-api
    static_configs:
      - targets:
          - localhost
        labels:
          job: anclora-api
          __path__: /var/log/anclora/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            correlation_id: correlation_id
            logger: logger
```

### ELK Stack

```json
{
  "index_patterns": ["anclora-api-*"],
  "mappings": {
    "properties": {
      "timestamp": { "type": "date" },
      "correlation_id": { "type": "keyword" },
      "level": { "type": "keyword" },
      "logger": { "type": "keyword" },
      "message": { "type": "text" }
    }
  }
}
```

### CloudWatch Logs

```python
# Usar USE_JSON_LOGS=true
# Los logs JSON son parseados automáticamente por CloudWatch Insights
```

## Referencias

- [Python logging documentation](https://docs.python.org/3/library/logging.html)
- [Context Variables (contextvars)](https://docs.python.org/3/library/contextvars.html)
- [FastAPI middleware](https://fastapi.tiangolo.com/tutorial/middleware/)
