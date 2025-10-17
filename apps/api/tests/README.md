# Test Suite - Anclora RAG API

## Descripción

Suite completa de tests unitarios para la API de Anclora RAG Generic, implementada con pytest.

## Estructura

```
tests/
├── __init__.py              # Inicialización del paquete
├── conftest.py              # Fixtures compartidas y configuración pytest
├── test_ingest.py           # Tests para endpoint /ingest (12 tests)
├── test_query.py            # Tests para endpoint /query (14 tests)
├── test_rag_pipeline.py     # Tests para RAG pipeline (10 tests)
└── README.md                # Este archivo
```

## Ejecutar Tests

### Todos los tests

```bash
cd apps/api
venv/Scripts/python.exe -m pytest
```

### Tests específicos por archivo

```bash
# Tests de ingesta
pytest tests/test_ingest.py

# Tests de query
pytest tests/test_query.py

# Tests de RAG pipeline
pytest tests/test_rag_pipeline.py
```

### Tests por marcadores

```bash
# Solo tests unitarios (rápidos, sin servicios externos)
pytest -m unit

# Tests de integración (requieren servicios activos)
pytest -m integration

# Tests lentos
pytest -m slow
```

### Opciones útiles

```bash
# Ver output detallado
pytest -v

# Mostrar print statements
pytest -s

# Ejecutar tests específicos
pytest tests/test_ingest.py::test_ingest_pdf_success

# Ver cobertura de código
pytest --cov=. --cov-report=html

# Ejecutar tests en paralelo (requiere pytest-xdist)
pytest -n auto
```

## Cobertura de Tests

### Endpoint `/ingest` (12 tests)

- ✅ Upload exitoso de PDF, TXT, MD
- ✅ Validación de extensiones permitidas
- ✅ Rechazo de archivos no soportados (.exe, .jpg)
- ✅ Rechazo de archivos vacíos
- ✅ Manejo de errores del worker (ValueError, FileNotFoundError, RuntimeError)
- ✅ Normalización de nombres con acentos
- ✅ Validación de filename faltante

### Endpoint `/query` (14 tests)

- ✅ Queries exitosos (POST y GET)
- ✅ Formato de respuesta correcto con campo `answer`
- ✅ Normalización de idioma (ES/EN)
- ✅ Parámetro `top_k` funcional
- ✅ Manejo de respuestas LLM sin fuentes
- ✅ Fallbacks para diferentes formatos de respuesta
- ✅ Truncamiento de texto de fuentes (200 chars)
- ✅ Consolidación de metadatos
- ✅ Manejo de errores del query engine

### RAG Pipeline (10 tests)

- ✅ Inicialización de Qdrant client
- ✅ Creación de colección si no existe
- ✅ Skip de creación si colección existe
- ✅ Creación de documentos con metadata
- ✅ Generación de embeddings
- ✅ Manejo de texto vacío
- ✅ Manejo de errores de Qdrant
- ✅ Verificación de configuración global (Settings, embeddings, dimensions)

## Fixtures Disponibles

### `client`
TestClient de FastAPI para hacer requests HTTP a los endpoints.

```python
def test_example(client):
    response = client.post("/ingest", files={"file": ...})
    assert response.status_code == 200
```

### `mock_qdrant_client`
Mock de QdrantClient para tests unitarios sin dependencia de Qdrant.

### `mock_embed_model`
Mock del modelo de embeddings.

### `mock_llm`
Mock del LLM de Ollama.

### `sample_pdf_bytes`
Bytes de un PDF válido mínimo para testing.

### `sample_text_content`
Contenido de texto de ejemplo.

### `mock_process_single_document`
Mock del worker de ingesta.

### `mock_index_text`
Mock de la función de indexación RAG.

## Configuración

### pytest.ini

Configuración global de pytest en `apps/api/pytest.ini`:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --tb=short
    --strict-markers
    --disable-warnings
markers =
    unit: Unit tests (fast, no external dependencies)
    integration: Integration tests (require external services)
    slow: Slow tests (may take several seconds)
```

## Marcadores Personalizados

- `@pytest.mark.unit`: Tests rápidos sin dependencias externas
- `@pytest.mark.integration`: Tests que requieren servicios (Qdrant, Ollama, etc.)
- `@pytest.mark.slow`: Tests que toman varios segundos

## Agregar Nuevos Tests

1. Crear archivo `test_<feature>.py` en `tests/`
2. Importar fixtures desde `conftest.py`
3. Usar marcadores apropiados (`@pytest.mark.unit`, etc.)
4. Seguir convención de nombres: `test_<description>`

Ejemplo:

```python
import pytest
from fastapi.testclient import TestClient

@pytest.mark.unit
def test_new_feature(client: TestClient):
    response = client.get("/new-endpoint")
    assert response.status_code == 200
```

## CI/CD Integration

Para integrar en CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run tests
  run: |
    cd apps/api
    venv/Scripts/python.exe -m pytest --cov=. --cov-report=xml
```

## Troubleshooting

### Import Errors

Si encuentras errores de imports, verifica que el `PYTHONPATH` incluya los directorios correctos:

```bash
# Windows
set PYTHONPATH=C:\path\to\project;C:\path\to\project\apps\api
pytest

# Linux/Mac
export PYTHONPATH=/path/to/project:/path/to/project/apps/api
pytest
```

### Mocks no funcionan

Asegúrate de que el path en `@patch` coincida con dónde se importa la función, no dónde está definida:

```python
# Correcto (donde se importa)
@patch("routes.ingest.process_single_document")

# Incorrecto (donde está definida)
@patch("workers.ingestion_worker.process_single_document")
```

## Contribuir

1. Todos los nuevos features deben incluir tests
2. Los tests deben pasar antes de hacer merge
3. Mantener cobertura > 80%
4. Usar mocks para dependencias externas en tests unitarios
5. Tests de integración solo cuando sea necesario

## Referencias

- [pytest documentation](https://docs.pytest.org/)
- [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [unittest.mock](https://docs.python.org/3/library/unittest.mock.html)
