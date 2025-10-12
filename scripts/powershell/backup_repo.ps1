param(
    [string]$Name,
    [switch]$IncludeModels,
    [switch]$Auto,
    [switch]$DumpDocker
)

$ErrorActionPreference = "Stop"

function Write-Info($message, $color = "DarkGray") { Write-Host $message -ForegroundColor $color }

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$backupsRoot = Join-Path $repoRoot "backups"
if (-not (Test-Path $backupsRoot)) { New-Item -ItemType Directory -Path $backupsRoot | Out-Null }

$now = Get-Date

if ($Auto) {
    $lastZip = Get-ChildItem -Path $backupsRoot -Filter "*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($lastZip) {
        $hours = ($now - $lastZip.LastWriteTime).TotalHours
        if ($hours -lt 24) {
            Write-Info "[backup] Omitido (auto): último backup hace $([math]::Round($hours,2)) h."
            return
        }
    }
}

$suffix = ""
if ($Name) {
    $safe = ($Name -replace "[^a-zA-Z0-9_\-]", "-")
    $suffix = "_$safe"
}

$archiveName = "{0}_{1}{2}.zip" -f $now.ToString("yyyyMMdd"), $now.ToString("HHmmss"), $suffix
$archivePath = Join-Path $backupsRoot $archiveName

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("anclora_backup_" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Info "[backup] Preparando $archiveName"

$include = @("apps","packages","infra","docs","scripts",".vscode","README.md","pyrightconfig.json")
if (Test-Path (Join-Path $repoRoot "AGENTS.md")) { $include += "AGENTS.md" }
if (Test-Path (Join-Path $repoRoot "PUERTOS.md")) { $include += "PUERTOS.md" }
if ($IncludeModels) { $include += "models" }

$copied = @()
foreach ($entry in $include) {
    $src = Join-Path $repoRoot $entry
    if (Test-Path $src) {
        $dst = Join-Path $tempDir $entry
        $parent = Split-Path $dst -Parent
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        Copy-Item $src -Destination $dst -Recurse -Force
        $copied += $entry
    }
}

$excludeDirs = @("node_modules","venv",".venv","__pycache__",".mypy_cache",".pytest_cache","logs","backups",".git")
Get-ChildItem -Path $tempDir -Recurse -Directory | Sort-Object FullName -Descending | Where-Object { $excludeDirs -contains $_.Name } | ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }

$meta = [ordered]@{
    createdAt = $now.ToString("o")
    sourceRepo = $repoRoot
    backupFile = $archiveName
    includes   = $copied
    options    = @{ includeModels = $IncludeModels.IsPresent; dumpDocker = $DumpDocker.IsPresent }
    git        = $null
}

try {
    $branch = git -C $repoRoot rev-parse --abbrev-ref HEAD 2>$null
    $commit = git -C $repoRoot rev-parse HEAD 2>$null
    if ($branch -or $commit) { $meta.git = @{ branch = $branch; commit = $commit } }
} catch { }

$dockerMeta = @{}
$dockerErrors = @()

function Invoke-DockerComposeCommand {
    param([string[]]$Args,[array]$ErrorAccumulator)
    $command = @("compose","-f",$script:composeFile) + $Args
    $output = & docker @command 2>&1
    $exitCode = $LASTEXITCODE
    if ($output) { $output | ForEach-Object { $ErrorAccumulator.Add($_) } }
    return $exitCode
}

function Copy-FromContainer {
    param([string]$Service,[string]$ContainerPath,[string]$Destination,[array]$ErrorAccumulator)
    $command = @("compose","-f",$script:composeFile,"cp",$Service + ":" + $ContainerPath,$Destination)
    $output = & docker @command 2>&1
    $exitCode = $LASTEXITCODE
    if ($output) { $output | ForEach-Object { $ErrorAccumulator.Add($_) } }
    return $exitCode
}

if ($DumpDocker) {
    $composeFile = Join-Path $repoRoot "infra/docker/docker-compose.dev.yml"
    if (Test-Path $composeFile) {
        $script:composeFile = $composeFile
        $dockerDir = Join-Path $tempDir "docker"
        New-Item -ItemType Directory -Path $dockerDir | Out-Null

        Write-Info "[backup] Exportando contenedores..."

        $pgTemp = "/tmp/anclora_postgres.sql"
        if (Invoke-DockerComposeCommand @("exec","-T","postgres","bash","-lc","pg_dumpall -U anclora_user > $pgTemp") $dockerErrors -eq 0) {
            $pgFile = Join-Path $dockerDir "postgres.sql"
            if (Copy-FromContainer "postgres" $pgTemp $pgFile $dockerErrors -eq 0) {
                $dockerMeta.postgres = "docker/postgres.sql"
            }
            Invoke-DockerComposeCommand @("exec","-T","postgres","rm","-f",$pgTemp) $dockerErrors | Out-Null
        }

        $qdTemp = "/tmp/anclora_qdrant.tar.gz"
        if (Invoke-DockerComposeCommand @("exec","-T","qdrant","bash","-lc","tar czf $qdTemp -C / qdrant/storage") $dockerErrors -eq 0) {
            $qdFile = Join-Path $dockerDir "qdrant_storage.tar.gz"
            if (Copy-FromContainer "qdrant" $qdTemp $qdFile $dockerErrors -eq 0) {
                $dockerMeta.qdrant = "docker/qdrant_storage.tar.gz"
            }
            Invoke-DockerComposeCommand @("exec","-T","qdrant","rm","-f",$qdTemp) $dockerErrors | Out-Null
        }

        $redisTemp = "/tmp/anclora_redis.tar.gz"
        if (Invoke-DockerComposeCommand @("exec","-T","redis","bash","-lc","tar czf $redisTemp -C / data") $dockerErrors -eq 0) {
            $redisFile = Join-Path $dockerDir "redis_data.tar.gz"
            if (Copy-FromContainer "redis" $redisTemp $redisFile $dockerErrors -eq 0) {
                $dockerMeta.redis = "docker/redis_data.tar.gz"
            }
            Invoke-DockerComposeCommand @("exec","-T","redis","rm","-f",$redisTemp) $dockerErrors | Out-Null
        }

        $ollamaTemp = "/tmp/anclora_ollama.tar.gz"
        if (Invoke-DockerComposeCommand @("exec","-T","ollama","bash","-lc","tar czf $ollamaTemp -C /root .ollama") $dockerErrors -eq 0) {
            $ollamaFile = Join-Path $dockerDir "ollama_data.tar.gz"
            if (Copy-FromContainer "ollama" $ollamaTemp $ollamaFile $dockerErrors -eq 0) {
                $dockerMeta.ollama = "docker/ollama_data.tar.gz"
            }
            Invoke-DockerComposeCommand @("exec","-T","ollama","rm","-f",$ollamaTemp) $dockerErrors | Out-Null
        }
    }
}

if ($dockerErrors.Count -gt 0) {
    $logPath = Join-Path $tempDir "docker_errors.log"
    $dockerErrors | Set-Content -Path $logPath -Encoding UTF8
    $meta.docker_errors = "docker_errors.log"
}

if ($dockerMeta.Keys.Count -gt 0) {
    $meta.docker = $dockerMeta
}

$meta | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $tempDir "_meta.json") -Encoding UTF8

Write-Info "[backup] Comprimiendo..."
Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $archivePath -CompressionLevel Optimal -Force

Write-Host "[backup] Backup creado: $archivePath" -ForegroundColor Green

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
