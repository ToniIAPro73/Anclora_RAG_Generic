<#
.SYNOPSIS
    Limpia duplicados de sentence-transformers en requirements.txt
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🔧 Limpiando requirements.txt..." -ForegroundColor Cyan

$repoRoot = $PSScriptRoot
$requirementsPath = Join-Path $repoRoot "apps\api\requirements.txt"

# Leer contenido
$lines = Get-Content $requirementsPath

Write-Host "`n📋 Versiones de sentence-transformers encontradas:" -ForegroundColor Yellow
$lines | Select-String "sentence-transformers" | ForEach-Object {
    Write-Host "   $_" -ForegroundColor DarkGray
}

# Filtrar: eliminar TODAS las líneas con sentence-transformers
$cleanedLines = $lines | Where-Object { $_ -notmatch "sentence-transformers" }

# Verificar que se eliminó el bloque de modelos gratuitos duplicado
$inFreeModelsBlock = $false
$finalLines = @()

foreach ($line in $cleanedLines) {
    if ($line -match "^# Modelos de embedding gratuitos") {
        if ($inFreeModelsBlock) {
            # Saltar bloque duplicado
            continue
        }
        $inFreeModelsBlock = $true
    }
    $finalLines += $line
}

# Añadir las dependencias correctas al final (una sola vez)
$newDeps = @"

# Modelos de embedding gratuitos
llama-index-embeddings-huggingface==0.4.0
sentence-transformers==3.3.1
torch==2.5.1
"@

$finalContent = ($finalLines -join "`n") + $newDeps

# Guardar
Set-Content -Path $requirementsPath -Value $finalContent -Encoding UTF8

Write-Host "`n✅ requirements.txt limpiado" -ForegroundColor Green

# Mostrar últimas líneas para verificar
Write-Host "`n📄 Últimas 10 líneas de requirements.txt:" -ForegroundColor Cyan
Get-Content $requirementsPath | Select-Object -Last 10 | ForEach-Object {
    Write-Host "   $_" -ForegroundColor DarkGray
}

Write-Host "`n🔍 Verificando sentence-transformers:" -ForegroundColor Yellow
$stCount = (Get-Content $requirementsPath | Select-String "sentence-transformers").Count
if ($stCount -eq 1) {
    Write-Host "   ✅ Solo 1 versión presente (correcto)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Aún hay $stCount versiones" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Ahora ejecuta: .\force_rebuild.ps1" -ForegroundColor Cyan