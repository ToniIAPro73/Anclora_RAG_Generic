<#
.SYNOPSIS
    Añade einops a requirements.txt y rebuild
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🔧 Añadiendo dependencia einops..." -ForegroundColor Cyan

$repoRoot = $PSScriptRoot
$requirementsPath = Join-Path $repoRoot "apps\api\requirements.txt"

# Verificar si ya existe
$content = Get-Content $requirementsPath -Raw

if ($content -match 'einops') {
    Write-Host "✅ einops ya existe en requirements.txt" -ForegroundColor Green
} else {
    Write-Host "📦 Añadiendo einops..." -ForegroundColor Yellow
    Add-Content -Path $requirementsPath -Value "einops==0.8.0"
    Write-Host "✅ einops añadido" -ForegroundColor Green
}

# Mostrar sección de modelos gratuitos
Write-Host "`n📄 Dependencias de modelos de embedding:" -ForegroundColor Cyan
Get-Content $requirementsPath | Select-String -Pattern "# Modelos de embedding|llama-index-embeddings|sentence-transformers|torch|einops" -Context 0,0 | ForEach-Object {
    Write-Host "   $_" -ForegroundColor DarkGray
}

Write-Host "`n🚀 Ejecutando rebuild automático..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Ejecutar rebuild
$infraDir = Join-Path $repoRoot "infra\docker"
Push-Location $infraDir

try {
    Write-Host "`n1️⃣ Deteniendo contenedores..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml down 2>$null
    
    Write-Host "`n2️⃣ Reconstruyendo API..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml build --no-cache api
    
    if ($LASTEXITCODE -ne 0) {
        throw "Error en el build"
    }
    
    Write-Host "`n3️⃣ Iniciando stack..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml up -d
    
    Write-Host "`n4️⃣ Esperando inicialización (30s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host "`n📋 Últimos logs:" -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml logs --tail=15 api
    
    Write-Host "`n🔍 Test de salud..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8030/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "`n✅ API funcionando correctamente" -ForegroundColor Green
        Write-Host "   $($response.Content)" -ForegroundColor DarkGray
        
        Write-Host "`n📡 Endpoints disponibles:" -ForegroundColor Cyan
        Write-Host "   • Health:  http://localhost:8030/health" -ForegroundColor DarkGray
        Write-Host "   • Docs:    http://localhost:8030/docs" -ForegroundColor DarkGray
        Write-Host "   • Ingest:  POST http://localhost:8030/ingest" -ForegroundColor DarkGray
        
    } catch {
        Write-Host "`n⚠️  Health check falló después de 30s" -ForegroundColor Yellow
        Write-Host "Mostrando más logs..." -ForegroundColor DarkGray
        docker compose -f docker-compose.dev.yml logs --tail=50 api
        Write-Host "`n💡 El modelo puede tardar más en cargar. Espera 1-2 min y prueba:" -ForegroundColor Cyan
        Write-Host "   curl http://localhost:8030/health" -ForegroundColor DarkGray
    }
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    docker compose -f docker-compose.dev.yml logs api
    exit 1
} finally {
    Pop-Location
}