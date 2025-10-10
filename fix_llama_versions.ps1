<#
.SYNOPSIS
    Actualiza llama-index-embeddings-huggingface a versión compatible
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🔧 Actualizando versiones de llama-index..." -ForegroundColor Cyan

$repoRoot = $PSScriptRoot
$requirementsPath = Join-Path $repoRoot "apps\api\requirements.txt"

# Leer contenido
$content = Get-Content $requirementsPath -Raw

Write-Host "`n📋 Reemplazando dependencias conflictivas..." -ForegroundColor Yellow

# Reemplazar la versión conflictiva
$content = $content -replace 'llama-index-embeddings-huggingface==0\.4\.0', 'llama-index-embeddings-huggingface>=0.5.0'

# Verificar que torch y sentence-transformers están correctamente
if ($content -notmatch 'sentence-transformers==3\.3\.1') {
    Write-Host "⚠️  Añadiendo sentence-transformers..." -ForegroundColor Yellow
    if ($content -notmatch '# Modelos de embedding gratuitos') {
        $content += "`n`n# Modelos de embedding gratuitos`n"
    }
    if ($content -notmatch 'sentence-transformers') {
        $content += "sentence-transformers==3.3.1`n"
    }
}

if ($content -notmatch 'torch==2\.5\.1') {
    Write-Host "⚠️  Añadiendo torch..." -ForegroundColor Yellow
    if ($content -notmatch 'torch') {
        $content += "torch==2.5.1`n"
    }
}

# Guardar
Set-Content -Path $requirementsPath -Value $content -NoNewline -Encoding UTF8

Write-Host "`n✅ Versiones actualizadas" -ForegroundColor Green

# Verificar resultado
Write-Host "`n📄 Dependencias de embeddings:" -ForegroundColor Cyan
Get-Content $requirementsPath | Select-String -Pattern "llama-index-embeddings|sentence-transformers|torch" | ForEach-Object {
    Write-Host "   $_" -ForegroundColor DarkGray
}

Write-Host "`n🚀 Ahora ejecuta: .\force_rebuild.ps1" -ForegroundColor Cyan