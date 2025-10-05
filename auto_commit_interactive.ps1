<#
  Script: auto_commit_interactive.ps1
  Objetivo:
    - (Opcional) Ejecutar checks de calidad: backend (pytest) y frontend (lint/tests)
    - git add . → commit (mensaje auto y cuerpo) → push
    - Cuenta tracked y untracked por separado (pre-add)
    - Pregunta si hay >5 cambios totales y NO se pasa -ForceYes
    - Mensaje de commit realista (tipo + scopes + stats + top files) a partir de STAGED changes
    - Log a autocommit.log con rotación simple (≥ 1 MB → reset)
  Uso:
    .\auto_commit_interactive.ps1
    .\auto_commit_interactive.ps1 -SkipChecks
    .\auto_commit_interactive.ps1 -OnlyBackend
    .\auto_commit_interactive.ps1 -OnlyFrontend
#>

param(
  [switch]$ForceYes,                # fuerza commit sin preguntar aunque haya >5 cambios
  [ValidateSet('enter','timer','exit','manual')]
  [string]$Source = 'manual',       # origen para el log
  [string]$LogPath,                 # ruta opcional del log
  [switch]$SkipChecks,              # salta checks (backend/frontend)
  [switch]$OnlyBackend,             # ejecuta sólo checks backend
  [switch]$OnlyFrontend             # ejecuta sólo checks frontend
)

$ErrorActionPreference = "Stop"
Write-Host "`n⚓ [Anclora-RAG] Auto-commit interactivo (source=$Source)" -ForegroundColor Cyan

# --- Rotación de log ---
$MaxLogBytes = 1MB  # 1 * 1024 * 1024

function Initialize-Log {
  # Resolver ruta del log
  if (-not $script:LogFileResolved) {
    $repoRoot = $null
    try { $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path } catch {}
    if ([string]::IsNullOrWhiteSpace($repoRoot)) {
      # Fallback: cwd absoluto
      $repoRoot = (Resolve-Path ".").Path
    }

    $script:LogFileResolved = if ($LogPath -and -not [string]::IsNullOrWhiteSpace($LogPath)) {
      $LogPath
    } else {
      Join-Path $repoRoot "logs\autocommit.log"
    }
  }

  # Asegurar carpeta del log (si existe parte de directorio)
  $logDir = $null
  try { $logDir = Split-Path -Parent $script:LogFileResolved } catch {}
  if (-not [string]::IsNullOrWhiteSpace($logDir)) {
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  }

  # Rotación simple si el archivo existe y excede tamaño
  if (Test-Path $script:LogFileResolved) {
    try {
      $size = (Get-Item $script:LogFileResolved).Length
      if ($size -ge $MaxLogBytes) {
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

# --- Forzar inicialización del log al inicio ---
Initialize-Log
Write-Log "START: script lanzado (source=$Source)"

# 1) Raíz del repo = carpeta del script (con fallback)
$repoPath = $null
try { $repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path } catch {}
if ([string]::IsNullOrWhiteSpace($repoPath)) {
  $repoPath = (Resolve-Path ".").Path
}
Set-Location $repoPath

# ------------------------------------------------------------
#  PRE-CHECKS DE CALIDAD (opcionales)
# ------------------------------------------------------------

function Get-NodeRunner {
  param([string]$webDir)
  if (Test-Path (Join-Path $webDir 'pnpm-lock.yaml')) { return 'pnpm' }
  if (Test-Path (Join-Path $webDir 'yarn.lock'))       { return 'yarn' }
  return 'npm'
}

function Run-BackendChecks {
  $apiDir = Join-Path $repoPath 'apps\api'
  if (-not (Test-Path $apiDir)) { Write-Log "Backend checks: apps/api no existe → skip"; return $true }

  Write-Host "`n🔎 Backend checks (pytest)..." -ForegroundColor Cyan
  Write-Log  "Backend checks iniciados"

  Push-Location $apiDir
  try {
    $venvPy = Join-Path $apiDir 'venv\Scripts\python.exe'
    $py = (Test-Path $venvPy) ? $venvPy : 'python'

    & $py -m pip show pytest > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Log "pytest no encontrado; instalando..."
      & $py -m pip install -q pytest | Out-Null
    }

    $hasTests = (Test-Path '.\tests') -or (Get-ChildItem -Recurse -Filter 'test_*.py' -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($hasTests) {
      & $py -m pytest -q
      if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend tests OK" -ForegroundColor Green
        Write-Log  "Backend tests OK"
      } elseif ($LASTEXITCODE -eq 5) {
        # 5 = No tests collected → lo tratamos como OK
        Write-Host "ℹ️  Pytest: sin tests recogidos (exit 5) → OK" -ForegroundColor DarkGray
        Write-Log  "Backend pytest exit 5 (no tests) → OK"
      } else {
        throw "pytest falló con código $LASTEXITCODE"
      }
    } else {
      Write-Host "ℹ️  No se encontraron tests en apps/api (skip)" -ForegroundColor DarkGray
      Write-Log  "Backend: sin tests → skip"
    }
    return $true
  } catch {
    Write-Host "❌ Backend tests FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Log  "Backend tests FAILED: $($_.Exception.Message)"
    return $false
  } finally {
    Pop-Location
  }
}

function Run-FrontendChecks {
  $webDir = Join-Path $repoPath 'apps\web'
  $pkgJson = Join-Path $webDir 'package.json'
  if (-not (Test-Path $webDir)) { Write-Log "Frontend checks: apps/web no existe → skip"; return $true }

  Write-Host "`n🔎 Frontend checks (lint/tests)..." -ForegroundColor Cyan
  Write-Log  "Frontend checks iniciados"

  Push-Location $webDir
  try {
    if (-not (Test-Path $pkgJson)) {
      Write-Host "ℹ️  Sin package.json → skip frontend checks" -ForegroundColor DarkGray
      Write-Log  "Frontend: sin package.json → skip"
      return $true
    }

    # Validar JSON mínimo
    try {
      $jsonText = Get-Content $pkgJson -Raw
      if ([string]::IsNullOrWhiteSpace($jsonText)) { throw "package.json vacío" }
      $null = $jsonText | ConvertFrom-Json
    } catch {
      Write-Host "ℹ️  package.json inválido o vacío → skip frontend checks" -ForegroundColor DarkGray
      Write-Log  "Frontend: package.json inválido/vacío → skip"
      return $true
    }

    $runner = Get-NodeRunner -webDir $webDir

    if (-not (Test-Path 'node_modules')) {
      Write-Log "Instalando dependencias frontend con $runner..."
      if ($runner -eq 'pnpm') { pnpm i }
      elseif ($runner -eq 'yarn') { yarn install }
      else { npm install }
      if ($LASTEXITCODE -ne 0) { throw "Instalación deps falló ($runner)" }
    }

    $lintOk = $true
    if ($runner -eq 'pnpm') { pnpm run -s lint 2>$null; $lintOk = ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) }
    elseif ($runner -eq 'yarn') { yarn run lint 2>$null; $lintOk = ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) }
    else { npm run lint --silent 2>$null; $lintOk = ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) }

    if ($lintOk) { Write-Host "✅ Frontend lint OK (o warnings tolerados)" -ForegroundColor Green; Write-Log "Frontend lint OK" }
    else { throw "Lint falló" }

    $hasTestScript = (Get-Content $pkgJson | Select-String -SimpleMatch '"test"')
    if ($hasTestScript) {
      if ($runner -eq 'pnpm') { pnpm run -s test }
      elseif ($runner -eq 'yarn') { yarn test }
      else { npm run test --silent }
      if ($LASTEXITCODE -ne 0) { throw "Tests frontend fallaron" }
      Write-Host "✅ Frontend tests OK" -ForegroundColor Green
      Write-Log  "Frontend tests OK"
    } else {
      Write-Host "ℹ️  No hay script 'test' en package.json (skip)" -ForegroundColor DarkGray
      Write-Log  "Frontend: sin script test → skip"
    }

    return $true
  } catch {
    Write-Host "❌ Frontend checks FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Log  "Frontend checks FAILED: $($_.Exception.Message)"
    return $false
  } finally {
    Pop-Location
  }
}

if (-not $SkipChecks) {
  $runBackend  = (-not $OnlyFrontend)
  $runFrontend = (-not $OnlyBackend)

  $okBackend  = $true
  $okFrontend = $true

  if ($runBackend)  { $okBackend  = Run-BackendChecks }
  if ($runFrontend) { $okFrontend = Run-FrontendChecks }

  if (-not ($okBackend -and $okFrontend)) {
    Write-Host "`n🛑 Checks fallidos → se cancela el commit/push." -ForegroundColor Red
    Write-Log  "Checks fallidos → commit cancelado."
    exit 1
  }
} else {
  Write-Host "⏭️  Checks de calidad saltados por -SkipChecks" -ForegroundColor DarkGray
  Write-Log  "Checks saltados (-SkipChecks)"
}

# ------------------------------------------------------------
#  FLUJO GIT (status → confirmación umbral → add → commit → push)
# ------------------------------------------------------------

# 2) Obtener status (pre-add) para total/tracked/untracked
$rawPre = git -c core.quotepath=off status --porcelain 2>$null
$textPre  = ($rawPre -is [Array]) ? ($rawPre -join "`n") : [string]$rawPre
$linesPre = @()
if ($null -ne $textPre) {
  $linesPre = ($textPre -split "`r?`n") | Where-Object { $_.Trim() -ne "" }
}
if ($linesPre.Count -eq 0) {
  Write-Host "✅ No hay cambios que commitear." -ForegroundColor Green
  Write-Log   "No hay cambios que commitear."
  exit 0
}

# Contabiliza tracked/untracked antes del add
$preUntracked = ($linesPre | Where-Object { $_ -match '^\?\?' }).Count
$preTracked   = $linesPre.Count - $preUntracked
$preTotal     = $linesPre.Count
Write-Host ("📋 Cambios (pre-add) → total:{0} tracked:{1} untracked:{2}" -f $preTotal,$preTracked,$preUntracked) -ForegroundColor Yellow
Write-Log  ("Cambios detectados (pre-add) → total:{0} tracked:{1} untracked:{2}" -f $preTotal,$preTracked,$preUntracked)

# 3) Umbral/confirmación
if ($preTotal -gt 5 -and -not $ForceYes) {
  $resp = Read-Host "Se detectaron $preTotal cambios (>5). ¿Continuar con commit/push? (s/n)"
  if ($resp -notin @('s','S','y','Y','si','sí','SI','Sí','YES','yes')) {
    Write-Host "🛑 Operación cancelada." -ForegroundColor Red
    Write-Log  "Usuario canceló (>$preTotal cambios)."
    exit 0
  }
}

# 4) STAGE real: git add .
Write-Host "`n➕ git add . (incluye untracked)" -ForegroundColor Green
git add .

# 5) Analizar SOLO lo staged para construir el commit
$stagedRaw = git diff --cached --name-status 2>$null
$stagedTxt = ($stagedRaw -is [Array]) ? ($stagedRaw -join "`n") : [string]$stagedRaw
$staged    = @()
if ($null -ne $stagedTxt) {
  $staged = ($stagedTxt -split "`r?`n") | Where-Object { $_.Trim() -ne "" }
}
if ($staged.Count -eq 0) {
  Write-Host "⚠️  No hay cambios staged tras 'git add .'. Nada que commitear." -ForegroundColor Yellow
  Write-Log  "Sin staged tras add."
  git status
  exit 0
}

# 5.1 Parsear staged en arrays y conteos
$A=$M=$D=$R=0
$stagedFiles=@()
$renamedPairs=@()
foreach ($line in $staged) {
  $parts = $line -split "`t"
  $code  = $parts[0].Trim()
  $path  = $null

  if ($code -like "R*") {
    $R++
    $rest = ($parts[1] -split "\s+->\s+")
    if ($rest.Length -eq 2) {
      $old = $rest[0].Trim(); $new = $rest[1].Trim()
      $renamedPairs += ,@($old,$new)
      $path = $new
    } else {
      $path = $parts[1].Trim()
    }
  } elseif ($code -eq "A") { $A++; $path = $parts[1].Trim() }
  elseif ($code -eq "M") { $M++; $path = $parts[1].Trim() }
  elseif ($code -eq "D") { $D++; $path = $parts[1].Trim() }
  else { $M++; $path = $parts[-1].Trim() }  # fallback

  if ($path) { $stagedFiles += $path }
}

# 5.2 Categorizar por área
function Get-Area {
  param([string]$p)
  if ($p -match '^apps/api/')              { return 'api' }
  if ($p -match '^apps/web/')              { return 'web' }
  if ($p -match '^packages/rag-core/')     { return 'core' }
  if ($p -match '^packages/parsers/')      { return 'parsers' }
  if ($p -match '^infra/')                 { return 'infra' }
  if ($p -match '^\.github/')              { return 'ci' }
  if ($p -match '(?i)/tests?/|^tests?/')   { return 'tests' }
  if ($p -match '(?i)\.md$')               { return 'docs' }
  if ($p -match '(?i)\.(json|ya?ml|toml|lock|env|config)$' -or
      $p -match '(?i)\.eslintrc|\.prettierrc|tailwind\.config|tsconfig|pyproject\.toml') { return 'config' }
  return 'misc'
}
$areas = $stagedFiles | ForEach-Object { Get-Area $_ }
$areaCounts = $areas | Group-Object | ForEach-Object { @{($_.Name) = $_.Count} } | ForEach-Object { $_ }
$areaMap = @{}
foreach ($kv in $areaCounts) {
  $k = $kv.Keys | Select-Object -First 1
  $v = $kv[$k]
  $areaMap[$k] = $v
}
# scopes = top 3 áreas
$scopes = ($areaMap.Keys | Sort-Object { - $areaMap[$_] } | Select-Object -First 3) -join ','
if ([string]::IsNullOrWhiteSpace($scopes)) { $scopes = 'root' }

# 5.3 Inferir tipo de commit
function Is-CodePath($p) { return ($p -match '\.(py|ts|tsx|js|jsx|go|rs|java|kt|c|cpp)$') }
$onlyDocs   = ($areas | Where-Object { $_ -ne 'docs' }).Count -eq 0
$onlyTests  = ($areas | Where-Object { $_ -ne 'tests' }).Count -eq 0
$onlyStyle  = ($stagedFiles | Where-Object { $_ -match '(?i)\.(css|scss|less)$' -or $_ -match 'tailwind\.config' }).Count -eq $stagedFiles.Count
$onlyCI     = ($areas | Where-Object { $_ -ne 'ci' }).Count -eq 0
$onlyBuild  = ($areas | Where-Object { $_ -ne 'infra' -and $_ -ne 'config' }).Count -eq 0 -and ($areas.Count -gt 0)

$containsFixName = ($stagedFiles | Where-Object { $_ -match '(?i)(fix|bug|hotfix|patch)' }).Count -gt 0
$codeFilesCount  = ($stagedFiles | Where-Object { Is-CodePath $_ }).Count

$type = 'chore'
if     ($onlyDocs)  { $type = 'docs' }
elseif ($onlyTests) { $type = 'test' }
elseif ($onlyStyle) { $type = 'style' }
elseif ($onlyCI)    { $type = 'ci' }
elseif ($onlyBuild) { $type = 'build' }
elseif ($containsFixName -and $codeFilesCount -gt 0) { $type = 'fix' }
elseif ($A -gt 0 -and $D -eq 0) { $type = 'feat' }
elseif ($codeFilesCount -ge 3 -and $M -gt 0 -and $A -eq 0 -and $D -eq 0) { $type = 'refactor' }

# breaking change si hay borrados o renombrados en áreas de código
$codeAreas = @('api','web','core','parsers')
$hasCodeDelete = ($stagedFiles | Where-Object { (Get-Area $_) -in $codeAreas } | ForEach-Object { $_ } | Measure-Object).Count -gt 0 -and $D -gt 0
$hasRename     = $R -gt 0
$bang = if ($hasCodeDelete -or $hasRename) { "!" } else { "" }

# 5.4 Subject y Body
$topFiles = ($stagedFiles | Select-Object -First 5 | ForEach-Object { [IO.Path]::GetFileName($_) }) -join ', '
$statsStr = "+$A ~${M} -$D R${R}"
$subject  = "$type$bang($scopes): $statsStr — $topFiles"

function Format-AreaSummary {
  param([hashtable]$map)
  if ($map.Keys.Count -eq 0) { return "areas: (none)" }
  $pairs = $map.Keys | Sort-Object { - $map[$_] } | ForEach-Object { "$($_):$($map[$_])" }
  return "areas → " + ($pairs -join ', ')
}
$areaSummary = Format-AreaSummary -map $areaMap
$linesBody = @()
$linesBody += $areaSummary
$linesBody += "staged → $statsStr"
$detail = @()
foreach ($line in $staged | Select-Object -First 12) { $detail += $line }
if ($staged.Count -gt 12) { $detail += "... ($($staged.Count - 12) más)" }
$body = ($linesBody + $detail) -join "`n"

# 6) Commit + Push
try {
  Write-Host "✅ git commit -m (subject + body)..." -ForegroundColor Green
  git commit -m $subject -m $body | Out-Null
  Write-Host "📝 $subject" -ForegroundColor DarkGray
  Write-Log  ("Commit creado → {0}" -f $subject)
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
