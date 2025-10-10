# Crear infraestructura de PostgreSQL
$ErrorActionPreference = "Stop"
Write-Host "`n🗄️  Creando infraestructura PostgreSQL..." -ForegroundColor Cyan

# Crear directorios
New-Item -ItemType Directory -Path "apps/api/database" -Force | Out-Null
New-Item -ItemType Directory -Path "scripts" -Force | Out-Null
Write-Host "✅ Directorios creados" -ForegroundColor Green

# ============================================
# 1. postgres_client.py
# ============================================
$postgresClientLines = @(
    "import os",
    "import psycopg2",
    "from psycopg2.extras import RealDictCursor",
    "from contextlib import contextmanager",
    "import logging",
    "",
    "logger = logging.getLogger(__name__)",
    "",
    "def get_connection_params():",
    "    return {",
    "        'host': os.getenv('POSTGRES_HOST', 'localhost'),",
    "        'port': int(os.getenv('POSTGRES_PORT', 5432)),",
    "        'database': os.getenv('POSTGRES_DB', 'anclora_rag'),",
    "        'user': os.getenv('POSTGRES_USER', 'anclora_user'),",
    "        'password': os.getenv('POSTGRES_PASSWORD', '')",
    "    }",
    "",
    "@contextmanager",
    "def get_db_connection():",
    "    conn = psycopg2.connect(**get_connection_params())",
    "    try:",
    "        yield conn",
    "        conn.commit()",
    "    except Exception as e:",
    "        conn.rollback()",
    "        logger.error(f'Database error: {e}')",
    "        raise",
    "    finally:",
    "        conn.close()",
    "",
    "def execute_query(query, params=None, fetch=False):",
    "    with get_db_connection() as conn:",
    "        with conn.cursor(cursor_factory=RealDictCursor) as cur:",
    "            cur.execute(query, params)",
    "            if fetch:",
    "                return cur.fetchall()",
    "            return cur.rowcount"
)

$postgresClientLines | Out-File -FilePath "apps/api/database/postgres_client.py" -Encoding UTF8
Write-Host "✅ postgres_client.py creado" -ForegroundColor Green

# ============================================
# 2. database/init.py
# ============================================
$dbInitLines = @(
    "from .postgres_client import execute_query",
    "import logging",
    "",
    "logger = logging.getLogger(__name__)",
    "",
    "SCHEMA_SQL = '''",
    "-- Tabla de batches de ingesta",
    "CREATE TABLE IF NOT EXISTS ingestion_batches (",
    "    id UUID PRIMARY KEY,",
    "    user_id UUID NOT NULL,",
    "    name VARCHAR(255) NOT NULL,",
    "    description TEXT,",
    "    status VARCHAR(50) NOT NULL DEFAULT 'pending',",
    "    qdrant_collection VARCHAR(255) NOT NULL,",
    "    total_files INTEGER DEFAULT 0,",
    "    processed_files INTEGER DEFAULT 0,",
    "    failed_files INTEGER DEFAULT 0,",
    "    total_size_bytes BIGINT DEFAULT 0,",
    "    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,",
    "    completed_at TIMESTAMP,",
    "    error_summary JSONB,",
    "    metadata JSONB",
    ");",
    "",
    "-- Tabla de documentos individuales",
    "CREATE TABLE IF NOT EXISTS batch_documents (",
    "    id UUID PRIMARY KEY,",
    "    batch_id UUID NOT NULL REFERENCES ingestion_batches(id) ON DELETE CASCADE,",
    "    filename VARCHAR(500) NOT NULL,",
    "    source_type VARCHAR(50) NOT NULL,",
    "    file_size BIGINT,",
    "    mime_type VARCHAR(100),",
    "    status VARCHAR(50) NOT NULL DEFAULT 'pending',",
    "    chunk_count INTEGER DEFAULT 0,",
    "    processed_at TIMESTAMP,",
    "    error_message TEXT,",
    "    metadata JSONB,",
    "    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    ");",
    "",
    "-- Índices para optimizar consultas",
    "CREATE INDEX IF NOT EXISTS idx_batches_status ON ingestion_batches(status);",
    "CREATE INDEX IF NOT EXISTS idx_batches_user ON ingestion_batches(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_documents_batch ON batch_documents(batch_id);",
    "CREATE INDEX IF NOT EXISTS idx_documents_status ON batch_documents(status);",
    "'''",
    "",
    "def init_database():",
    "    try:",
    "        logger.info('Inicializando esquema de base de datos...')",
    "        execute_query(SCHEMA_SQL)",
    "        logger.info('Esquema de base de datos inicializado correctamente')",
    "        return True",
    "    except Exception as e:",
    "        logger.error(f'Error al inicializar base de datos: {e}')",
    "        raise"
)

$dbInitLines | Out-File -FilePath "apps/api/database/init.py" -Encoding UTF8
Write-Host "✅ database/init.py creado" -ForegroundColor Green

# ============================================
# 3. database/__init__.py
# ============================================
$dbInitPyLines = @(
    "from .postgres_client import get_db_connection, execute_query",
    "from .init import init_database",
    "",
    "__all__ = ['get_db_connection', 'execute_query', 'init_database']"
)

$dbInitPyLines | Out-File -FilePath "apps/api/database/__init__.py" -Encoding UTF8
Write-Host "✅ database/__init__.py creado" -ForegroundColor Green

# ============================================
# 4. scripts/init_db.py
# ============================================
$initDbLines = @(
    "import sys",
    "import os",
    "from pathlib import Path",
    "",
    "# Añadir apps/api al path",
    "sys.path.insert(0, str(Path(__file__).parent.parent / 'apps' / 'api'))",
    "",
    "from database import init_database",
    "from dotenv import load_dotenv",
    "import logging",
    "",
    "logging.basicConfig(level=logging.INFO)",
    "logger = logging.getLogger(__name__)",
    "",
    "def main():",
    "    # Cargar variables de entorno",
    "    env_path = Path(__file__).parent.parent / '.env'",
    "    load_dotenv(env_path)",
    "    ",
    "    logger.info('Iniciando inicialización de base de datos...')",
    "    logger.info(f'Host: {os.getenv(\"POSTGRES_HOST\")}')",
    "    logger.info(f'Database: {os.getenv(\"POSTGRES_DB\")}')",
    "    ",
    "    try:",
    "        init_database()",
    "        logger.info('✅ Base de datos inicializada correctamente')",
    "    except Exception as e:",
    "        logger.error(f'❌ Error: {e}')",
    "        sys.exit(1)",
    "",
    "if __name__ == '__main__':",
    "    main()"
)

$initDbLines | Out-File -FilePath "scripts/init_db.py" -Encoding UTF8
Write-Host "✅ scripts/init_db.py creado" -ForegroundColor Green

# ============================================
# 5. Actualizar requirements.txt
# ============================================
Write-Host "`n📦 Verificando dependencias..." -ForegroundColor Cyan
$reqFile = "apps/api/requirements.txt"
$reqContent = Get-Content $reqFile -Raw

$newDeps = @("psycopg2-binary", "python-dotenv")
$added = $false

foreach ($dep in $newDeps) {
    if ($reqContent -notmatch $dep) {
        Add-Content -Path $reqFile -Value $dep
        Write-Host "  + $dep añadido" -ForegroundColor Green
        $added = $true
    }
}

if (-not $added) {
    Write-Host "  ✅ Todas las dependencias ya están presentes" -ForegroundColor Green
}

# ============================================
# Resumen
# ============================================
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Infraestructura PostgreSQL creada" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📁 Archivos creados:" -ForegroundColor Cyan
Write-Host "   • apps/api/database/postgres_client.py" -ForegroundColor White
Write-Host "   • apps/api/database/init.py" -ForegroundColor White
Write-Host "   • apps/api/database/__init__.py" -ForegroundColor White
Write-Host "   • scripts/init_db.py" -ForegroundColor White

Write-Host "`n🚀 SIGUIENTE PASO: Levantar servicios" -ForegroundColor Yellow
Write-Host "   cd infra/docker" -ForegroundColor Cyan
Write-Host "   docker compose -f docker-compose.dev.yml up --build -d" -ForegroundColor Cyan
Write-Host ""