<#
  Script: auto_commit_interactive.ps1
  Objetivo:
    - git add . → commit (mensaje auto) → push
    - Cuenta tracked y untracked por separado
    - Si hay >5 cambios y NO se pasa -ForceYes, pregunta antes de continuar
    - Log a autocommit.log con origen (enter/timer/exit/manual) y mensaje de commit
    - Rotación simple del log: si ≥ 1 MB, se limpia y reinicia
#>

param(
  [switch]$ForceYes,                # fuerza commit sin preguntar aunque haya >5 cambios
  [ValidateSet('enter','timer','exit','manual')]
  [string]$Source = 'manual',       # origen de la ejecución (para el log)
  [string]$LogPath                  # ruta opcional del log
)

$ErrorActionPreference = "Stop"
Write-Host "`n⚓ [Anclora-RAG] Auto-commit interactivo (source=$Source)" -ForegroundColor Cyan

# --- Config rotación de log ---
$MaxLogBytes = 1MB  # 1 * 1024 * 1024

# 0) Utilidad de logging con rotación
function Initialize-Log {
  if (-not $script:LogFileResolved) {
    $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    $script:LogFileResolved = if ($LogPath) { $LogPath } else { Join-Path $repoRoot "autocommit.log" }
  }
  $logDir = Split-Path -Parent $script:LogFileResolved
  if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

  if (Test-Path $script:LogFileResolved) {
    try {
      $size = (Get-Item $script:LogFileResolved).Length
      if ($size -ge $MaxLogBytes) {
        # Rotación simple: limpiar y reescribir cabecera
        Set-Content -Path $script:LogFileResolved -Value ""
        Add-Content -Path $script:LogFileResolved -Value "[LOG RESET] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') — log reiniciado por superar $MaxLogBytes bytes"
      }
    } catch { }
  }
}

function Write-Log {
  param([string]$Msg)
  try {
    Initialize-Log
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $script:LogFileResolved -Value "[$ts] [$Source] $Msg"
  } catch { }
}

# 1) Raíz del repo = carpeta del script
$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

# 2) Obtener status en formato estable (incluye untracked '??')
$raw = git -c core.quotepath=off status --porcelain 2>$null
$text  = ($raw -is [Array]) ? ($raw -join "`n") : [string]$raw
$lines = @()
if ($null -ne $text) {
  $lines = ($text -split "`r?`n") | Where-Object { $_.Trim() -ne "" }
}

if ($lines.Count -eq 0) {
  Write-Host "✅ No hay cambios que commitear." -ForegroundColor Green
  Write-Log   "No hay cambios que commitear."
  exit 0
}

# 3) Clasificación tracked/untracked y por tipo
$added=$modified=$deleted=$renamed=$unmerged=0
$untracked=0; $tracked=0
$files=@()

foreach ($l in $lines) {
  if ($l -match '^\?\?\s+(?<p>.+)$') { $untracked++; $files += $Matches.p; continue }
  $tracked++
  $files += ($l -replace '^\s*[A-Z\?\s]{1,2}\s+','')

  $xy = $l.Substring(0,[Math]::Min(2,$l.Length)).Trim()
  if ($xy -match 'R') { $renamed++ ; continue }
  if ($xy -match 'D') { $deleted++ ; continue }
  if ($xy -match 'U') { $unmerged++; continue }
  if ($xy -match 'A') { $added++   ; continue }
  if ($xy -match 'M') { $modified++;continue }
}

$total   = $tracked + $untracked
$summary = "total:$total tracked:$tracked untracked:$untracked (+$added ~${modified} -$deleted R${renamed} U${unmerged})"
Write-Host ("📋 Cambios → {0}" -f $summary) -ForegroundColor Yellow
Write-Log  ("Cambios detectados → {0}" -f $summary)

# 4) Umbral / confirmación (solo si no se fuerza)
if ($total -gt 5 -and -not $ForceYes) {
  $resp = Read-Host "Se detectaron $total cambios (>5). ¿Continuar con commit/push? (s/n)"
  if ($resp -notin @('s','S','y','Y','si','sí','SI','Sí','YES','yes')) {
    Write-Host "🛑 Operación cancelada." -ForegroundColor Red
    Write-Log  "Usuario canceló (>$total cambios)."
    exit 0
  }
}

# 5) Mensaje de commit claro
$scopes = ($files | ForEach-Object {
  $first = ($_ -split '[\\/]')[0]; if ([string]::IsNullOrWhiteSpace($first)) {'root'} else {$first}
} | Select-Object -Unique | Select-Object -First 3) -join ','

if ([string]::IsNullOrWhiteSpace($scopes)) { $scopes = 'root' }

$type = if ($added -gt 0 -and $deleted -eq 0) { 'feat' }
        elseif ($deleted -gt 0 -and $added -eq 0 -and $modified -eq 0) { 'chore' }
        else { 'chore' }

$sampleFiles = ($files | Select-Object -Unique | Select-Object -First 5 | ForEach-Object { [IO.Path]::GetFileName($_) }) -join ', '
$now = Get-Date -Format "yyyy-MM-dd HH:mm"
$stats = "tracked:$tracked untracked:$untracked | +$added ~${modified} -$deleted R${renamed} U${unmerged}"
$commitMsg = "$type($scopes): $stats — $sampleFiles [$now]"

# 6) add / commit / push
Write-Host "`n➕ git add . (incluye untracked)" -ForegroundColor Green
git add .

try {
  Write-Host "✅ git commit -m ..." -ForegroundColor Green
  git commit -m $commitMsg | Out-Null
  Write-Host "📝 $commitMsg" -ForegroundColor DarkGray
  Write-Log  ("Commit creado → {0}" -f $commitMsg)
} catch {
  Write-Host "⚠️  No se pudo crear el commit (quizá no hay diferencias tras el add)." -ForegroundColor Yellow
  Write-Log  "Commit fallido: no había diferencias tras el add."
  git status
  exit 0
}

try {
  Write-Host "🚀 git push" -ForegroundColor Green
  git push | Out-Null
  Write-Log  "Push OK."
} catch {
  Write-Log  ("Push ERROR: {0}" -f $_.Exception.Message)
  throw
}

Write-Host "`n🎯 Listo." -ForegroundColor Green
