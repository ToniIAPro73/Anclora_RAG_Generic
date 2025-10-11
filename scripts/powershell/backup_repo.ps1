<# 
.SYNOPSIS
    Crea un backup comprimido del repositorio con metadatos.

.DESCRIPTION
    Copia los directorios relevantes del proyecto hacia una carpeta temporal,
    limpia caches habituales y genera un archivo .zip dentro de `backups/`
    con un nombre basado en la fecha. Incluye metadatos (rama, commit, rutas)
    en `_meta.json` dentro del backup.

.PARAMETER Name
    Sufijo opcional para el nombre del backup. Se normaliza a caracteres seguros.

.PARAMETER IncludeModels
    Incluye la carpeta `models/` en el backup (por defecto se omite porque puede ser pesada).

.PARAMETER Auto
    Sólo crea el backup si todavía no existe uno para la fecha actual (YYYYMMDD*).

.EXAMPLE
    powershell .\scripts\powershell\backup_repo.ps1

.EXAMPLE
    powershell .\scripts\powershell\backup_repo.ps1 -Name after-refactor -IncludeModels

.EXAMPLE
    powershell .\scripts\powershell\backup_repo.ps1 -Auto
#>

param(
    [string]$Name,
    [switch]$IncludeModels,
    [switch]$Auto
)

$ErrorActionPreference = "Stop"

function Write-Info($message, $color = "DarkGray") {
    Write-Host $message -ForegroundColor $color
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
$backupsRoot = Join-Path $repoRoot "backups"
if (-not (Test-Path $backupsRoot)) {
    New-Item -ItemType Directory -Path $backupsRoot | Out-Null
}

$timestamp = Get-Date
$dateKey = $timestamp.ToString("yyyyMMdd")

if ($Auto) {
    $found = Get-ChildItem -Path $backupsRoot -Filter "$dateKey*.zip" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        Write-Info "🔁 Backup omitido (Auto): ya existe $($found.Name) para hoy."
        return
    }
}

$suffix = ""
if ($Name) {
    $safe = ($Name -replace "[^a-zA-Z0-9_\-]", "-")
    $suffix = "_$safe"
}

$archiveName = "{0}_{1}{2}.zip" -f $dateKey, $timestamp.ToString("HHmmss"), $suffix
$archivePath = Join-Path $backupsRoot $archiveName

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("anclora_backup_" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Info "📦 Preparando backup en $archiveName..." "Cyan"

$include = @(
    "apps",
    "packages",
    "infra",
    "docs",
    "scripts",
    ".vscode",
    "README.md",
    "pyrightconfig.json",
    "AGENTS.md",
    "PUERTOS.md"
)

if ($IncludeModels) {
    $include += "models"
}

$existent = @()
foreach ($entry in $include) {
    $source = Join-Path $repoRoot $entry
    if (Test-Path $source) {
        $dest = Join-Path $tempDir $entry
        $parent = Split-Path $dest -Parent
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        Write-Info "  • Copiando $entry"
        Copy-Item $source -Destination $dest -Recurse -Force -ErrorAction Stop
        $existent += $entry
    }
}

$excludeDirs = @("node_modules", "venv", ".venv", "__pycache__", ".mypy_cache", ".pytest_cache", "logs", "backups", ".git")
Get-ChildItem -Path $tempDir -Recurse -Directory | Where-Object { $excludeDirs -contains $_.Name } | ForEach-Object {
    Write-Info "  ⨯ Eliminando $_"
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

$meta = [ordered]@{
    createdAt = $timestamp.ToString("o")
    sourceRepo = $repoRoot
    backupFile = $archiveName
    includes   = $existent
    options    = @{
        includeModels = $IncludeModels.IsPresent
    }
    git = $null
}

try {
    $branch = git -C $repoRoot rev-parse --abbrev-ref HEAD 2>$null
    $commit = git -C $repoRoot rev-parse HEAD 2>$null
    if ($branch -or $commit) {
        $meta.git = @{
            branch = $branch
            commit = $commit
        }
    }
} catch { }

$meta | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $tempDir "_meta.json") -Encoding UTF8

Write-Info "🗜️  Comprimiendo..."
Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $archivePath -CompressionLevel Optimal -Force

Write-Info "✅ Backup creado: $archivePath" "Green"

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
