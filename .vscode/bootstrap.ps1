# .vscode/bootstrap.ps1 — Arranque de terminal VS Code para Anclora-RAG
param(
  [string]$BackendPath = "$PSScriptRoot\..\apps\api",
  [string]$VenvName    = "venv"
)

# ------------------------------------------------------------
# 0) Utilidades
# ------------------------------------------------------------

function Write-Info($msg, $color="DarkGray") { Write-Host $msg -ForegroundColor $color }

# Devuelve objeto con Total/Tracked/Untracked usando git porcelain (incluye "??")
function Get-PendingCounts {
  param([string]$RepoPath)

  $result = [pscustomobject]@{ Total = 0; Tracked = 0; Untracked = 0 }

  try {
    $inside = git -C $RepoPath rev-parse --is-inside-work-tree 2>$null
    if ($inside -ne "true") { return $result }

    $raw = git -C $RepoPath -c core.quotepath=off status --porcelain 2>$null
    if ($null -eq $raw)    { return $result }

    $txt   = ($raw -is [Array]) ? ($raw -join "`n") : [string]$raw
    $lines = ($txt -split "`r?`n") | Where-Object { $_.Trim() -ne "" }
    if ($lines.Count -eq 0) { return $result }

    $untracked = ($lines | Where-Object { $_ -match '^\?\?' }).Count
    $tracked   = $lines.Count - $untracked

    $result.Total     = $lines.Count
    $result.Tracked   = $tracked
    $result.Untracked = $untracked
    return $result
  } catch {
    return $result
  }
}

# ------------------------------------------------------------
# 1) Backend: entrar, crear venv si no existe y activar
# ------------------------------------------------------------

# Ir al backend
Set-Location -Path $BackendPath

# Crear venv si no existe
if (-not (Test-Path ".\$VenvName\Scripts\Activate.ps1")) {
  Write-Host "[Anclora-RAG] Creando entorno virtual en $BackendPath\$VenvName..." -ForegroundColor Cyan
  python -m venv $VenvName
}

# Activar venv en ESTA sesión
. ".\$VenvName\Scripts\Activate.ps1"

Write-Host "[Anclora-RAG] venv activado. Directorio: $((Get-Location).Path)" -ForegroundColor Green
Write-Host "[Anclora-RAG] Python: $((Get-Command python).Source)" -ForegroundColor DarkGray

# ------------------------------------------------------------
# 2) Auto-commit: al entrar, timer, y al salir (con logging)
# ------------------------------------------------------------

# Rutas importantes
$RepoRoot     = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$CommitScript = Join-Path $RepoRoot "scripts/powershell/auto_commit_interactive.ps1"
$LogPath      = Join-Path $RepoRoot "logs\autocommit.log"
$global:AncloraRepoRoot    = $RepoRoot
$global:AncloraCommitScript = $CommitScript
$global:AncloraLogPath      = $LogPath

# --- Al ENTRAR: auto-commit si hay ≥1 cambios (sin preguntar)
try {
  $counts = Get-PendingCounts -RepoPath $RepoRoot
  if ($counts.Total -ge 1) {
    Write-Host "[Anclora-RAG] Al entrar: $($counts.Total) cambios (tracked:$($counts.Tracked) untracked:$($counts.Untracked)) → auto-commit..." -ForegroundColor Yellow
    & $CommitScript -ForceYes -Source enter -LogPath $LogPath
  } else {
    Write-Info "[Anclora-RAG] Al entrar: sin cambios."
  }
} catch {
  Write-Info "[Anclora-RAG] Aviso al entrar: $($_.Exception.Message)" "DarkYellow"
}

Set-Location $RepoRoot

# --- Timer 30 min: solo si total > 5 (con confirmación en el propio script)
if (-not (Get-EventSubscriber -SourceIdentifier "AncloraAutoCommitTimer" -ErrorAction SilentlyContinue)) {
  $global:AncloraAutoCommitTimer = New-Object Timers.Timer
  $global:AncloraAutoCommitTimer.Interval = 30 * 60 * 1000   # 30 min
  $global:AncloraAutoCommitTimer.AutoReset = $true

  Register-ObjectEvent -InputObject $global:AncloraAutoCommitTimer `
  -EventName Elapsed `
  -SourceIdentifier "AncloraAutoCommitTimer" `
  -MessageData @{ Repo=$RepoRoot; Log=$LogPath; Script=$CommitScript } `
  -Action {
    try {
      $repo = $event.MessageData.Repo
      $log  = $event.MessageData.Log
      $cmd  = $event.MessageData.Script

      $raw = git -C $repo -c core.quotepath=off status --porcelain 2>$null
      $txt = ($raw -is [Array]) ? ($raw -join "`n") : [string]$raw
      $count = (($txt -split "`r?`n") | Where-Object { $_.Trim() -ne "" }).Length

      if ($count -gt 5) {
        Write-Host "[Anclora-RAG] Timer 30m: $count cambios → auto-commit (sin checks)..." -ForegroundColor Cyan
        & $cmd -Source timer -LogPath $log -SkipChecks
      } else {
        Write-Host "[Anclora-RAG] Timer 30m: $count cambios (≤5) → sin acción." -ForegroundColor DarkGray
      }
    } catch {
      Write-Host "[Anclora-RAG] Timer error: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
  } | Out-Null

  $global:AncloraAutoCommitTimer.Start()
  Write-Host "[Anclora-RAG] Timer de auto-commit (30m) activado." -ForegroundColor Green
} else {
  Write-Info "[Anclora-RAG] Timer ya activo; no se duplica."
}

# --- Al SALIR: auto-commit si hay ≥1 cambios (sin preguntar)
if (-not (Get-EventSubscriber -SourceIdentifier "AncloraOnExit" -ErrorAction SilentlyContinue)) {
  Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    try {
      $repo = $global:AncloraRepoRoot
      if (-not $repo) { $repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path }
      $log  = $global:AncloraLogPath
      if (-not $log) { $log = Join-Path $repo "logs\autocommit.log" }
      $cmd  = $global:AncloraCommitScript
      if (-not (Test-Path $cmd)) { $cmd = Join-Path $repo "scripts/powershell/auto_commit_interactive.ps1" }

      # Apagar/limpiar timer si existe
      try {
        if ($global:AncloraAutoCommitTimer) {
          $global:AncloraAutoCommitTimer.Stop()
          $global:AncloraAutoCommitTimer.Dispose()
        }
        Unregister-Event -SourceIdentifier "AncloraAutoCommitTimer" -ErrorAction SilentlyContinue
      } catch {}

      $raw = git -C $repo -c core.quotepath=off status --porcelain 2>$null
      $txt = ($raw -is [Array]) ? ($raw -join "`n") : [string]$raw
      $count = (($txt -split "`r?`n") | Where-Object { $_.Trim() -ne "" }).Length

      if ($count -ge 1) {
        Write-Host "[Anclora-RAG] Al salir: $count cambios → auto-commit final..." -ForegroundColor Yellow
        & $cmd -ForceYes -Source exit -LogPath $log
      } else {
        Write-Host "[Anclora-RAG] Al salir: sin cambios." -ForegroundColor DarkGray
      }
    } catch {
      Write-Host "[Anclora-RAG] Error en hook de salida: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
  } | Out-Null

  Write-Host "[Anclora-RAG] Hook de salida registrado." -ForegroundColor Green
} else {
  Write-Info "[Anclora-RAG] Hook de salida ya registrado."
}
