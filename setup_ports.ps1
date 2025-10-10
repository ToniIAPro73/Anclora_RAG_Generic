# Script de actualización de puertos para Anclora RAG Generic
# Ejecutar desde la raíz del proyecto

$ErrorActionPreference = "Stop"
Write-Host "`n🔧 Configurando puertos para Anclora RAG Generic..." -ForegroundColor Cyan

# ============================================
# 1. CREAR PUERTOS.md
# ============================================
$puertosLines = @(
    "# Anclora RAG Generic - Port Configuration",
    "",
    "| Service    | Port  | Description                    |",
    "|------------|-------|--------------------------------|",
    "| Frontend   | 3030  | Web UI (Streamlit/React)       |",
    "| Backend    | 8030  | FastAPI REST API               |",
    "| PostgreSQL | 5462  | Database (metadata, batches)   |",
    "| Qdrant     | 6363  | Vector database                |",
    "| Redis      | 6389  | Task queue                     |",
    "| Ollama     | 11464 | Local LLM inference            |",
    "",
    "## Development Setup",
    "",
    "To run the services locally:",
    "",
    "- **Frontend**: <http://localhost:3030>",
    "- **Backend API**: <http://localhost:8030>",
    "- **API Docs**: <http://localhost:8030/docs>",
    "- **Qdrant Dashboard**: <http://localhost:6363/dashboard>",
    "- **PostgreSQL**: ``localhost:5462``",
    "- **Redis**: ``localhost:6389``",
    "- **Ollama**: <http://localhost:11464>",
    "",
    "## Multi-Project Context",
    "",
    "This port configuration avoids conflicts with:",
    "- **Anclora Flow**: Frontend 3020, Backend 8020, Database 5452",
    "- **Anclora Kairon**: (specify ports if active)",
    "",
    "## Connection Examples",
    "",
    "``````bash",
    "# PostgreSQL",
    "psql -h localhost -p 5462 -U anclora_user -d anclora_rag",
    "",
    "# Redis CLI",
    "redis-cli -p 6389",
    "",
    "# Test API",
    "curl http://localhost:8030/health",
    "",
    "# Qdrant collections",
    "curl http://localhost:6363/collections",
    "``````"
)

$puertosLines | Out-File -FilePath "PUERTOS.md" -Encoding UTF8
Write-Host "✅ PUERTOS.md creado" -ForegroundColor Green

# ============================================
# 2. ACTUALIZAR docker-compose.dev.yml
# ============================================
Write-Host "`n📝 Actualizando docker-compose.dev.yml..." -ForegroundColor Cyan

$composeFile = "infra/docker/docker-compose.dev.yml"
$composeDir = "infra/docker"

if (-not (Test-Path $composeDir)) {
    New-Item -ItemType Directory -Path $composeDir -Force | Out-Null
    Write-Host "📁 Directorio $composeDir creado" -ForegroundColor Green
}

if (Test-Path $composeFile) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$composeFile.backup_$timestamp"
    Copy-Item $composeFile $backupFile
    Write-Host "📦 Backup creado: $backupFile" -ForegroundColor Yellow
}

$composeLines = @(
    "services:",
    "  postgres:",
    "    image: postgres:16-alpine",
    "    environment:",
    "      POSTGRES_DB: anclora_rag",
    "      POSTGRES_USER: anclora_user",
    "      POSTGRES_PASSWORD: anclora_secure_pass_2025",
    "    ports:",
    "      - ""5462:5432""",
    "    volumes:",
    "      - postgres_data:/var/lib/postgresql/data",
    "    healthcheck:",
    "      test: [""CMD-SHELL"", ""pg_isready -U anclora_user""]",
    "      interval: 10s",
    "      timeout: 5s",
    "      retries: 5",
    "",
    "  qdrant:",
    "    image: qdrant/qdrant:v1.7.4",
    "    ports:",
    "      - ""6363:6333""",
    "      - ""6364:6334""",
    "    environment:",
    "      - QDRANT__SERVICE__GRPC_PORT=6334",
    "    volumes:",
    "      - qdrant_data:/qdrant/storage",
    "",
    "  redis:",
    "    image: redis:7.2-alpine",
    "    command: redis-server --appendonly yes",
    "    ports:",
    "      - ""6389:6379""",
    "    volumes:",
    "      - redis_data:/data",
    "",
    "  ollama:",
    "    image: ollama/ollama:latest",
    "    ports:",
    "      - ""11464:11434""",
    "    volumes:",
    "      - ollama_data:/root/.ollama",
    "",
    "  api:",
    "    build:",
    "      context: ../../apps/api",
    "      dockerfile: Dockerfile",
    "    env_file:",
    "      - ""../../.env""",
    "    volumes:",
    "      - ../../apps/api:/app",
    "      - ../../packages:/packages",
    "      - ../../models:/models",
    "      - `${env:USERPROFILE}/.cache/huggingface:/root/.cache/huggingface",
    "    depends_on:",
    "      postgres:",
    "        condition: service_healthy",
    "      qdrant:",
    "        condition: service_started",
    "      redis:",
    "        condition: service_started",
    "      ollama:",
    "        condition: service_started",
    "    ports:",
    "      - ""8030:8000""",
    "    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
    "    healthcheck:",
    "      test: [""CMD"", ""wget"", ""--no-verbose"", ""--tries=1"", ""--spider"", ""http://localhost:8000/health""]",
    "      interval: 30s",
    "      timeout: 10s",
    "      retries: 3",
    "",
    "  worker:",
    "    build:",
    "      context: ../../apps/api",
    "      dockerfile: Dockerfile",
    "    env_file:",
    "      - ""../../.env""",
    "    volumes:",
    "      - ../../apps/api:/app",
    "      - ../../packages:/packages",
    "      - ../../models:/models",
    "      - `${env:USERPROFILE}/.cache/huggingface:/root/.cache/huggingface",
    "    depends_on:",
    "      redis:",
    "        condition: service_started",
    "      qdrant:",
    "        condition: service_started",
    "      postgres:",
    "        condition: service_healthy",
    "    command: rq worker ingestion_queue --url redis://redis:6379",
    "",
    "volumes:",
    "  postgres_data:",
    "  qdrant_data:",
    "  redis_data:",
    "  ollama_data:"
)

$composeLines | Out-File -FilePath $composeFile -Encoding UTF8
Write-Host "✅ docker-compose.dev.yml actualizado" -ForegroundColor Green

# ============================================
# 3. ACTUALIZAR .env.example
# ============================================
Write-Host "`n📝 Actualizando .env.example..." -ForegroundColor Cyan

$envExampleFile = ".env.example"

if (Test-Path $envExampleFile) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$envExampleFile.backup_$timestamp"
    Copy-Item $envExampleFile $backupFile
    Write-Host "📦 Backup creado: $backupFile" -ForegroundColor Yellow
}

$envLines = @(
    "# PostgreSQL Configuration (internal container access)",
    "POSTGRES_HOST=postgres",
    "POSTGRES_PORT=5432",
    "POSTGRES_DB=anclora_rag",
    "POSTGRES_USER=anclora_user",
    "POSTGRES_PASSWORD=anclora_secure_pass_2025",
    "",
    "# Qdrant Configuration (internal container access)",
    "QDRANT_URL=http://qdrant:6333",
    "",
    "# Redis Configuration (internal container access)",
    "REDIS_URL=redis://redis:6379",
    "",
    "# Ollama Configuration (internal container access)",
    "OLLAMA_BASE_URL=http://ollama:11434",
    "OLLAMA_MODEL=mixtral:8x7b",
    "",
    "# Embedding Model Configuration",
    "EMBEDDING_MODEL=nomic-ai/nomic-embed-text-v1.5",
    "EMBEDDING_DEVICE=cuda",
    "",
    "# API Configuration",
    "API_HOST=0.0.0.0",
    "API_PORT=8000",
    "MAX_FILE_SIZE_MB=50",
    "MAX_BATCH_SIZE_MB=500",
    "",
    "# GitHub Token (optional, for private repos)",
    "GITHUB_TOKEN=",
    "",
    "# Storage Paths",
    "TEMP_STORAGE_PATH=/tmp/ingestion",
    "PERSISTENT_STORAGE_PATH=/data/ingestion",
    "",
    "# Worker Configuration",
    "WORKER_CONCURRENCY=4",
    "WORKER_LOG_LEVEL=INFO"
)

$envLines | Out-File -FilePath $envExampleFile -Encoding UTF8
Write-Host "✅ .env.example actualizado" -ForegroundColor Green

# ============================================
# 4. CREAR .env SI NO EXISTE
# ============================================
Write-Host "`n📝 Verificando .env..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Copy-Item $envExampleFile ".env"
    Write-Host "✅ .env creado desde .env.example" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANTE: Revisa y ajusta las credenciales en .env si es necesario" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  .env ya existe, no se modificó (usa .env.example como referencia)" -ForegroundColor DarkGray
}

# ============================================
# 5. RESUMEN FINAL
# ============================================
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 RESUMEN DE CAMBIOS COMPLETADOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n✅ Archivos creados/actualizados:" -ForegroundColor Green
Write-Host "   • PUERTOS.md" -ForegroundColor White
Write-Host "   • infra/docker/docker-compose.dev.yml" -ForegroundColor White
Write-Host "   • .env.example" -ForegroundColor White

Write-Host "`n📍 Puertos configurados (sin conflictos):" -ForegroundColor Cyan
Write-Host "   • Backend API:    8030  (docs en /docs)" -ForegroundColor White
Write-Host "   • PostgreSQL:     5462" -ForegroundColor White
Write-Host "   • Qdrant:         6363  (dashboard en /dashboard)" -ForegroundColor White
Write-Host "   • Redis:          6389" -ForegroundColor White
Write-Host "   • Ollama:         11464" -ForegroundColor White
Write-Host "   • Frontend:       3030  (pendiente implementar)" -ForegroundColor DarkGray

Write-Host "`n🚀 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "`n1️⃣  Navegar al directorio de Docker:" -ForegroundColor White
Write-Host "   cd infra/docker" -ForegroundColor Cyan

Write-Host "`n2️⃣  Levantar todos los servicios:" -ForegroundColor White
Write-Host "   docker compose -f docker-compose.dev.yml up --build -d" -ForegroundColor Cyan

Write-Host "`n3️⃣  Verificar que todo está corriendo:" -ForegroundColor White
Write-Host "   docker compose -f docker-compose.dev.yml ps" -ForegroundColor Cyan

Write-Host "`n4️⃣  Ver logs en tiempo real:" -ForegroundColor White
Write-Host "   docker compose -f docker-compose.dev.yml logs -f" -ForegroundColor Cyan

Write-Host "`n5️⃣  Probar los servicios:" -ForegroundColor White
Write-Host "   # API Health" -ForegroundColor DarkGray
Write-Host "   curl http://localhost:8030/health" -ForegroundColor Cyan
Write-Host "   # API Docs (abrir en navegador)" -ForegroundColor DarkGray
Write-Host "   start http://localhost:8030/docs" -ForegroundColor Cyan
Write-Host "   # Qdrant Dashboard (abrir en navegador)" -ForegroundColor DarkGray
Write-Host "   start http://localhost:6363/dashboard" -ForegroundColor Cyan

Write-Host "`n📚 Comandos útiles adicionales:" -ForegroundColor Yellow
Write-Host "   # Parar servicios" -ForegroundColor DarkGray
Write-Host "   docker compose -f docker-compose.dev.yml down" -ForegroundColor Cyan
Write-Host "   # Reiniciar solo API" -ForegroundColor DarkGray
Write-Host "   docker compose -f docker-compose.dev.yml restart api" -ForegroundColor Cyan
Write-Host "   # Ver logs de un servicio específico" -ForegroundColor DarkGray
Write-Host "   docker compose -f docker-compose.dev.yml logs -f api" -ForegroundColor Cyan
Write-Host "   # Limpiar volúmenes (resetea BD)" -ForegroundColor DarkGray
Write-Host "   docker compose -f docker-compose.dev.yml down -v" -ForegroundColor Cyan

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Configuración completada exitosamente" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""