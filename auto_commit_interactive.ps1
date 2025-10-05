<#
  Script: auto_commit_interactive.ps1
  Objetivo:
    - git add . → commit (mensaje auto) → push
    - Cuenta tracked y untracked por separado
    - Si hay >5 cambios y NO se pasa -ForceYes, pregunta antes de continuar
#>

param(
  [switch]$ForceYes  # fuerza el commit sin preguntar aunque haya >5 cambios
)

$ErrorActionPreference = "Stop"
Write-Host "`n⚓ [Anclora-RAG] Auto-commit interactivo" -ForegroundColor Cyan

# 1) Raíz del repo = carpeta del script
$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

# 2) Obtener status en formato estable (incluye untracked '??')
$raw = git -c core.quotepath=off status --porcelain 2>$null
if ($null -eq $raw) { Write-Host "❔ No es repo git o sin cambios." -ForegroundColor Yellow; exit 0 }
$text  = ($raw -is [Array]) ? ($raw -join "`n") : [string]$raw
$lines = ($text -split "`r?`n") | Where-Object { $_.Trim() -ne "" }
if ($lines.Count -eq 0) { Write-Host "✅ No hay cambios que commitear." -ForegroundColor Green; exit 0 }

# 3) Clasificación tracked / untracked y por tipo
$added=$modified=$deleted=$renamed=$unmerged=0
$untracked=0; $tracked=0
$files=@()

foreach ($l in $lines) {
  if ($l -match '^\?\?\s+(?<p>.+)$') { $untracked++; $files += $Matches.p; continue }
  $tracked++
  $files += ($l -replace '^\s*[A-Z\?\s]{1,2}\s+','')

  $xy = $l.Substring(0,[Math]::Min(2,$l.Length)).Trim()
  if ($xy -match 'R') { $renamed++;  continue }
  if ($xy -match 'D') { $deleted++;  continue }
  if ($xy -match 'U') { $unmerged++; continue }
  if ($xy -match 'A') { $added++;    continue }
  if ($xy -match 'M') { $modified++; continue }
}

$total = $tracked + $untracked
Write-Host ("📋 Cambios → total:{0}  tracked:{1}  untracked:{2}" -f $total,$tracked,$untracked) -ForegroundColor Yellow

# 4) Umbral / confirmación
if ($total -gt 5 -and -not $ForceYes) {
  $resp = Read-Host "Se detectaron $total cambios (>5). ¿Continuar con commit/push? (s/n)"
  if ($resp -notin @('s','S','y','Y','si','sí','SI','Sí','YES','yes')) {
    Write-Host "🛑 Operación cancelada." -ForegroundColor Red
    exit 0
  }
}

# 5) Mensaje de commit rico y claro
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
  git commit -m $commitMsg
  Write-Host "📝 $commitMsg" -ForegroundColor DarkGray
} catch {
  Write-Host "⚠️  No se pudo crear el commit (quizá no hay diferencias tras el add)." -ForegroundColor Yellow
  git status
  exit 0
}

Write-Host "🚀 git push" -ForegroundColor Green
git push

Write-Host "`n🎯 Listo." -ForegroundColor Green
