<#
  Script: setup_vscode.ps1
  Objetivo:
    - Crear carpeta .vscode/
    - Generar bootstrap.ps1 (auto venv al abrir terminal en VS Code)
    - Generar settings.json (perfil PowerShell por defecto apuntando al bootstrap)
    - Crear/activar venv del backend (apps/api/venv)
    - Instalar dependencias backend y generar requirements.txt si no existe
#>

$ErrorActionPreference = "Stop"

Write-Host "`n🛠️  Configurando entorno VS Code + Backend (venv + deps)..." -ForegroundColor Cyan

# --- Rutas base
$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$vscodeDir  = Join-Path $workspace ".vscode"
$bootstrap  = Join-Path $vscodeDir "bootstrap.ps1"
$settings   = Join-Path $vscodeDir "settings.json"

$backendPath = Join-Path $workspace "apps\api"
$venvPath    = Join-Path $backendPath "venv"
$pyExe       = Join-Path $venvPath "Scripts\python.exe"
$reqPath     = Join-Path $backendPath "requirements.txt"

# --- 0) Comprobaciones mínimas
if (-not (Test-Path $backendPath)) {
  throw "No existe la ruta de backend: $backendPath"
}

# --- 1) Crear .vscode
if (-not (Test-Path $vscodeDir)) {
  New-Item -ItemType Directory -Path $vscodeDir | Out-Null
  Write-Host "📁 .vscode creado." -ForegroundColor Green
}

# --- 2) bootstrap.ps1
@"
# .vscode/bootstrap.ps1 – inicializa entorno virtual del backend automáticamente
param(
  [string]`$BackendPath = "`$PSScriptRoot\..\apps\api",
  [string]`$VenvName    = "venv"
)
Set-Location -Path `$BackendPath
if (-not (Test-Path ".\`$VenvName\Scripts\Activate.ps1")) {
  Write-Host "[Anclora-RAG] Creando entorno virtual..." -ForegroundColor Cyan
  python -m venv `$VenvName
}
. ".\`$VenvName\Scripts\Activate.ps1"
Write-Host "[Anclora-RAG] venv activado. Directorio: `$((Get-Location).Path)" -ForegroundColor Green
Write-Host "[Anclora-RAG] Python: `$((Get-Command python).Source)" -ForegroundColor DarkGray
if (Test-Path "requirements.txt") {
  Write-Host "[Anclora-RAG] requirements.txt detectado (instala manualmente con: pip install -r requirements.txt)" -ForegroundColor DarkGray
}
"@ | Out-File -Encoding UTF8 $bootstrap -Force
Write-Host "✅ bootstrap.ps1 listo." -ForegroundColor Green

# --- 3) settings.json
@"
{
  "terminal.integrated.cwd": "${workspaceFolder}\\apps\\api",
  "terminal.integrated.profiles.windows": {
    "Anclora Backend PS": {
      "source": "PowerShell",
      "icon": "terminal-powershell",
      "args": [
        "-NoLogo",
        "-NoExit",
        "-Command",
        ". '${workspaceFolder}\\.vscode\\bootstrap.ps1'"
      ]
    }
  },
  "terminal.integrated.defaultProfile.windows": "Anclora Backend PS",
  "python.defaultInterpreterPath": "${workspaceFolder}/apps/api/venv/Scripts/python.exe",
  "python.terminal.activateEnvironment": false
}
"@ | Out-File -Encoding UTF8 $settings -Force
Write-Host "✅ settings.json listo." -ForegroundColor Green

# --- 4) Crear venv si no existe
if (-not (Test-Path (Join-Path $venvPath "Scripts\Activate.ps1"))) {
  Push-Location $backendPath
  Write-Host "🐍 Creando entorno virtual en $venvPath ..." -ForegroundColor Cyan
  python -m venv "venv"
  Pop-Location
} else {
  Write-Host "ℹ️  venv ya existe: $venvPath" -ForegroundColor DarkGray
}

# --- 5) Instalar dependencias (si no hay requirements.txt, instala base y lo genera)
$baseDeps = @(
  "fastapi",
  "uvicorn[standard]",
  "qdrant-client",
  "llama-index",
  "redis",
  "rq",
  "python-dotenv",
  "unstructured",
  "tiktoken",
  "httpx"
)
$devDeps = @("pytest","pytest-asyncio")

Write-Host "📦 Instalando dependencias en el venv..." -ForegroundColor Cyan
Push-Location $backendPath

# Activamos el intérprete del venv directamente
& $pyExe -m pip install --upgrade pip

if (Test-Path $reqPath) {
  Write-Host "requirements.txt detectado → instalación desde archivo..." -ForegroundColor Yellow
  & $pyExe -m pip install -r $reqPath
} else {
  Write-Host "No hay requirements.txt → instalación base del proyecto..." -ForegroundColor Yellow
  & $pyExe -m pip install @baseDeps
  & $pyExe -m pip install @devDeps
  & $pyExe -m pip freeze | Out-File -Encoding ascii $reqPath
  Write-Host "📝 requirements.txt generado." -ForegroundColor Green
}

Pop-Location

Write-Host "`n🎯 Configuración completada."
Write-Host "   - VS Code abrirá PowerShell en apps/api con el venv activo."
Write-Host "   - Intérprete Python por defecto: $pyExe" -ForegroundColor DarkGray
Write-Host "   - Puedes abrir VS Code y pulsar Ctrl+` para verificar." -ForegroundColor Yellow
