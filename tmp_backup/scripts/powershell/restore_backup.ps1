<# 
.SYNOPSIS
    Restaura un backup generado con backup_repo.ps1.

.PARAMETER Backup
    Ruta al archivo .zip del backup o nombre relativo dentro de la carpeta `backups`.

.PARAMETER Target
    Carpeta destino donde se extraerá el contenido. Por defecto crea `restore_yyyyMMdd_HHmmss` en el repositorio.

.PARAMETER Overwrite
    Sobrescribe la carpeta destino si ya existe.

.EXAMPLE
    powershell .\scripts\powershell\restore_backup.ps1 -Backup backups\20251011_093000.zip

.EXAMPLE
    powershell .\scripts\powershell\restore_backup.ps1 -Latest

.PARAMETER Latest
    Restaura el backup más reciente de la carpeta `backups`.
#>

param(
    [string]$Backup,
    [string]$Target,
    [switch]$Overwrite,
    [switch]$Latest
)

$ErrorActionPreference = "Stop"

function Resolve-BackupPath {
    param([string]$candidate, [switch]$PickLatest)
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
    $backupsRoot = Join-Path $repoRoot "backups"

    if ($PickLatest) {
        $latest = Get-ChildItem -Path $backupsRoot -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $latest) { throw "No se encontraron backups en $backupsRoot." }
        return $latest.FullName
    }

    if ([string]::IsNullOrWhiteSpace($candidate)) {
        throw "Debes especificar -Backup <ruta> o usar -Latest."
    }

    if (Test-Path $candidate) {
        return (Resolve-Path $candidate).Path
    }

    $relative = Join-Path $backupsRoot $candidate
    if (Test-Path $relative) {
        return (Resolve-Path $relative).Path
    }

    throw "No se encontró el backup indicado: $candidate"
}

$backupPath = Resolve-BackupPath -candidate $Backup -PickLatest:$Latest
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path

if (-not $Target) {
    $Target = Join-Path $repoRoot ("restore_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
}

if (Test-Path $Target) {
    if (-not $Overwrite) {
        throw "La carpeta destino '$Target' ya existe. Usa -Overwrite para reemplazarla."
    }
    Remove-Item $Target -Recurse -Force
}

New-Item -ItemType Directory -Path $Target -Force | Out-Null

Write-Host "📦 Restaurando $backupPath → $Target" -ForegroundColor Cyan
Expand-Archive -Path $backupPath -DestinationPath $Target -Force

$metaPath = Join-Path $Target "_meta.json"
if (Test-Path $metaPath) {
    Write-Host "ℹ️  Metadatos del backup:" -ForegroundColor DarkGray
    Get-Content $metaPath
}

Write-Host "✅ Restauración completada. Revisa el contenido en $Target" -ForegroundColor Green
