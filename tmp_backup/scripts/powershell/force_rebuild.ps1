<#
.SYNOPSIS
    Rebuild forzado del contenedor API
.DESCRIPTION
    Limpia caché, volúmenes y reconstruye completamente el contenedor API
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🔧 Rebuild forzado del contenedor API..." -ForegroundColor Cyan

$repoRoot = $PSScriptRoot
$infraDir = Join-Path $repoRoot "infra\docker"

Push-Location $infraDir

try {
    Write-Host "`n1️⃣ Deteniendo y eliminando contenedores..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml down -v 2>$null
    
    Write-Host "`n2️⃣ Limpiando caché de Docker..." -ForegroundColor Yellow
    docker builder prune -f 2>$null
    
    Write-Host "`n3️⃣ Reconstruyendo API (sin caché)..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml build --no-cache --pull api
    
    if ($LASTEXITCODE -ne 0) {
        throw "Error en el build del contenedor API"
    }
    
    Write-Host "`n4️⃣ Iniciando stack completo..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml up -d
    
    Write-Host "`n5️⃣ Esperando inicialización (30s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "`n📊 Estado de contenedores:" -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml ps
    
    Write-Host "`n📋 Logs del API (últimas 20 líneas):" -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml logs --tail=20 api
    
    Write-Host "`n⏳ Esperando startup completo (25s adicionales)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 25
    
    Write-Host "`n🔍 Test de salud..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8030/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ API funcionando correctamente" -ForegroundColor Green
        Write-Host "   Respuesta: $($response.Content)" -ForegroundColor DarkGray
    } catch {
        Write-Host "⚠️  Health check falló, mostrando logs completos..." -ForegroundColor Yellow
        docker compose -f docker-compose.dev.yml logs api
        throw "API no responde en http://localhost:8030/health"
    }
    
    Write-Host "`n🎯 Rebuild completado exitosamente" -ForegroundColor Green
    Write-Host "`n📡 Endpoints disponibles:" -ForegroundColor Cyan
    Write-Host "   • Health:  http://localhost:8030/health" -ForegroundColor DarkGray
    Write-Host "   • Docs:    http://localhost:8030/docs" -ForegroundColor DarkGray
    Write-Host "   • Ingest:  http://localhost:8030/ingest" -ForegroundColor DarkGray
    
    Write-Host "`n📊 Ver logs en tiempo real:" -ForegroundColor Cyan
    Write-Host "   docker compose -f infra/docker/docker-compose.dev.yml logs -f api" -ForegroundColor DarkGray

} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n📋 Mostrando logs completos del API:" -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml logs api
    exit 1
} finally {
    Pop-Location
}