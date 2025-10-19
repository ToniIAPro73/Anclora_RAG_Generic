# Script para iniciar el entorno de desarrollo completo
# Uso: .\scripts\powershell\start_dev.ps1

Write-Host "=== Iniciando Anclora RAG Development Stack ===" -ForegroundColor Cyan

# Verificar que estamos en el directorio raíz del proyecto
if (!(Test-Path ".\infra\docker\docker-compose.dev.yml")) {
    Write-Host "ERROR: Ejecuta este script desde el directorio raíz del proyecto" -ForegroundColor Red
    exit 1
}

# 1. Iniciar servicios Docker (backend, databases, worker)
Write-Host "`n[1/3] Iniciando servicios Docker..." -ForegroundColor Yellow
docker compose -f infra/docker/docker-compose.dev.yml up -d

# Esperar a que los servicios estén saludables
Write-Host "Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 2. Verificar salud del backend
Write-Host "`n[2/3] Verificando backend API..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$apiHealthy = $false

while ($retryCount -lt $maxRetries -and !$apiHealthy) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8030/health" -Method Get -TimeoutSec 2
        if ($response.status -eq "healthy") {
            $apiHealthy = $true
            Write-Host "✓ API está funcionando (version: $($response.version))" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "  Intento $retryCount/$maxRetries - Esperando API..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (!$apiHealthy) {
    Write-Host "ERROR: API no respondió después de $maxRetries intentos" -ForegroundColor Red
    Write-Host "Verifica los logs con: docker logs docker-api-1" -ForegroundColor Yellow
    exit 1
}

# 3. Iniciar frontend Next.js en segundo plano
Write-Host "`n[3/3] Iniciando frontend Next.js..." -ForegroundColor Yellow
Push-Location apps\web

# Matar cualquier proceso previo en el puerto 3030
npx kill-port 3030 2>$null

# Iniciar servidor de desarrollo
Start-Job -Name "NextJS-Dev" -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
} | Out-Null

Pop-Location

# Esperar a que Next.js esté listo
Write-Host "Esperando a que Next.js esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$maxRetries = 10
$retryCount = 0
$nextHealthy = $false

while ($retryCount -lt $maxRetries -and !$nextHealthy) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3030" -Method Get -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $nextHealthy = $true
            Write-Host "✓ Frontend está funcionando" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "  Intento $retryCount/$maxRetries - Esperando frontend..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (!$nextHealthy) {
    Write-Host "ADVERTENCIA: Frontend no respondió, pero puede estar compilando" -ForegroundColor Yellow
}

# Resumen
Write-Host "`n=== Stack de Desarrollo Iniciado ===" -ForegroundColor Green
Write-Host ""
Write-Host "Servicios disponibles:" -ForegroundColor Cyan
Write-Host "  • Frontend:  http://localhost:3030" -ForegroundColor White
Write-Host "  • API:       http://localhost:8030" -ForegroundColor White
Write-Host "  • Docs API:  http://localhost:8030/docs" -ForegroundColor White
Write-Host "  • Qdrant:    http://localhost:6363/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Logs:" -ForegroundColor Cyan
Write-Host "  • Backend:   docker logs -f docker-api-1" -ForegroundColor White
Write-Host "  • Worker:    docker logs -f docker-worker-1" -ForegroundColor White
Write-Host "  • Frontend:  Get-Job NextJS-Dev | Receive-Job" -ForegroundColor White
Write-Host ""
Write-Host "Para detener:" -ForegroundColor Cyan
Write-Host "  • Todo:      .\scripts\powershell\stop_dev.ps1" -ForegroundColor White
Write-Host "  • Frontend:  npx kill-port 3030" -ForegroundColor White
Write-Host "  • Backend:   docker compose -f infra/docker/docker-compose.dev.yml down" -ForegroundColor White
Write-Host ""
Write-Host "Estado actual: WebSocket Push implementado - Listo para testing" -ForegroundColor Green
Write-Host ""
