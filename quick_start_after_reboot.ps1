# Script de inicio rápido después del reinicio
# Ejecutar: .\quick_start_after_reboot.ps1

Write-Host "=== Anclora RAG - Inicio Rápido ===" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar Docker
Write-Host "[1/4] Verificando Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker está corriendo" -ForegroundColor Green
    } else {
        Write-Host "✗ Docker no responde. Por favor:" -ForegroundColor Red
        Write-Host "  1. Abre Docker Desktop desde el menú inicio" -ForegroundColor Red
        Write-Host "  2. Espera a que diga 'Engine running'" -ForegroundColor Red
        Write-Host "  3. Vuelve a ejecutar este script" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error al verificar Docker" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Iniciar servicios Docker
Write-Host "[2/4] Iniciando servicios (Postgres, Qdrant, Redis)..." -ForegroundColor Yellow
docker-compose -f infra/docker/docker-compose.dev.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Servicios iniciados" -ForegroundColor Green
} else {
    Write-Host "✗ Error al iniciar servicios" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Esperar a que PostgreSQL esté listo
Write-Host "[3/4] Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
$maxRetries = 30
$retry = 0
$ready = $false

while ($retry -lt $maxRetries -and -not $ready) {
    $retry++
    Write-Host "  Intento $retry/$maxRetries..." -NoNewline

    $pgTest = docker exec docker-postgres-1 pg_isready -U anclora_user 2>&1

    if ($pgTest -match "accepting connections") {
        Write-Host " ✓" -ForegroundColor Green
        $ready = $true
    } else {
        Write-Host " ..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "✗ PostgreSQL no respondió a tiempo" -ForegroundColor Red
    Write-Host "Puedes verificar logs con: docker logs docker-postgres-1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Paso 4: Iniciar API
Write-Host "[4/4] Iniciando API de Anclora..." -ForegroundColor Yellow
Write-Host "  La API se iniciará en http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

cd apps/api
uvicorn main:app --reload --port 8000 --host 0.0.0.0
