<#
.SYNOPSIS
    Comenta temporalmente el import de batch router
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🔧 Corrigiendo imports en main.py..." -ForegroundColor Cyan

$repoRoot = $PSScriptRoot
$mainPath = Join-Path $repoRoot "apps\api\main.py"

if (-not (Test-Path $mainPath)) {
    throw "No se encuentra main.py en: $mainPath"
}

# Leer contenido
$content = Get-Content $mainPath -Raw

# Verificar si existe el import problemático
if ($content -match 'from routes\.batch import router as batch_router') {
    Write-Host "📝 Comentando import de batch_router..." -ForegroundColor Yellow
    
    # Comentar import
    $content = $content -replace 'from routes\.batch import router as batch_router', '# from routes.batch import router as batch_router  # TODO: Fix import path'
    
    # Comentar include_router
    $content = $content -replace 'app\.include_router\(batch_router\)', '# app.include_router(batch_router)  # TODO: Fix import path'
    
    # Guardar
    Set-Content -Path $mainPath -Value $content -NoNewline -Encoding UTF8
    
    Write-Host "✅ Imports comentados" -ForegroundColor Green
} else {
    Write-Host "✅ No se encontró import de batch_router (ya está corregido)" -ForegroundColor Green
}

# Mostrar imports actuales
Write-Host "`n📄 Imports en main.py:" -ForegroundColor Cyan
Get-Content $mainPath | Select-String -Pattern "^from routes\." | ForEach-Object {
    Write-Host "   $_" -ForegroundColor DarkGray
}

Write-Host "`n🚀 Reiniciando API..." -ForegroundColor Yellow
$infraDir = Join-Path $repoRoot "infra\docker"
Push-Location $infraDir

try {
    docker compose -f docker-compose.dev.yml restart api
    
    Write-Host "`n⏳ Esperando inicialización (10s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "`n📋 Últimos logs:" -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml logs --tail=20 api
    
    Write-Host "`n🔍 Test de salud..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8030/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "`n✅ API funcionando!" -ForegroundColor Green
        Write-Host "   $($response.Content)" -ForegroundColor DarkGray
    } catch {
        Write-Host "`n⚠️  Health check falló, mostrando más logs..." -ForegroundColor Yellow
        docker compose -f docker-compose.dev.yml logs --tail=50 api
    }
    
} finally {
    Pop-Location
}