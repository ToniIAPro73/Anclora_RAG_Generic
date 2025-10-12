param(
    [string]$Name,
    [switch]$IncludeModels,
    [switch]$Auto,
    [switch]$DumpDocker
)

$ErrorActionPreference = "Stop"

function Write-Info($message) { Write-Host $message -ForegroundColor DarkGray }

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$backupsRoot = Join-Path $repoRoot "backups"
if (-not (Test-Path $backupsRoot)) { New-Item -ItemType Directory -Path $backupsRoot | Out-Null }

$now = Get-Date

if ($Auto) {
    $latest = Get-ChildItem -Path $backupsRoot -Filter "*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
        $hours = ($now - $latest.LastWriteTime).TotalHours
        if ($hours -lt 24) {
            Write-Info "[backup] Omitido (auto): último backup hace $([math]::Round($hours,2)) horas."
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
Get-ChildItem -Path $tempDir -Recurse -Directory | Sort-Object FullName -Descending | Where-Object { $excludeDirs -contains $_.Name } | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }

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

if ($DumpDocker) {
    $composeFile = Join-Path $repoRoot "infra/docker/docker-compose.dev.yml"
    if (Test-Path $composeFile) {
        $dockerDir = Join-Path $tempDir "docker"
        New-Item -ItemType Directory -Path $dockerDir | Out-Null
        $stderrPath = Join-Path $dockerDir "docker_dump.log"

        function Invoke-DockerComposeCommand {
    param([string[]]$Args)
    $command = @("compose","-f",$composeFile) + $Args
    $output = & docker @command 2>&1
    if ($output) { $output | Out-File -Append -FilePath $stderrPath }
    return $LASTEXITCODE
}


        function Copy-FromContainer {
    param([string]$Service,[string]$ContainerPath,[string]$Destination)
    $command = @("compose","-f",$composeFile,"cp",$Service + ":" + $ContainerPath,$Destination)
    $output = & docker @command 2>&1
    if ($output) { $output | Out-File -Append -FilePath $stderrPath }
    return $LASTEXITCODE
}


        Write-Info "[backup] Exportando contenedores..."

        $pgTemp = "/tmp/anclora_postgres.sql"
        if (Invoke-DockerComposeCommand @("exec","postgres","bash","-lc", "pg_dumpall -U anclora_user > $pgTemp") -eq 0) {
            $pgFile = Join-Path $dockerDir "postgres.sql"
            if (Copy-FromContainer "postgres" $pgTemp $pgFile -eq 0) {
                Invoke-DockerComposeCommand @("exec","postgres","rm","-f",$pgTemp) | Out-Null
                $dockerMeta.postgres = "docker/postgres.sql"
            }
        }

        $qdTemp = "/tmp/anclora_qdrant.tar.gz"
        if (Invoke-DockerComposeCommand @("exec","qdrant","bash","-lc","tar czf $qdTemp -C / qdrant/storage") -eq 0) {
            $qdFile = Join-Path $dockerDir "qdrant_storage.tar.gz"
            if (Copy-FromContainer "qdrant" $qdTemp $qdFile -eq 0) {
                Invoke-DockerComposeCommand @("exec","qdrant","rm","-f",$qdTemp) | Out-Null
                $dockerMeta.qdrant = "docker/qdrant_storage.tar.gz"
            }
        }

        $redisTemp = "/tmp/anclora_redis.tar.gz"
        if (Invoke-DockerComposeCommand @("exec","redis","bash","-lc","tar czf $redisTemp -C / data") -eq 0) {
            $redisFile = Join-Path $dockerDir "redis_data.tar.gz"
            if (Copy-FromContainer "redis" $redisTemp $redisFile -eq 0) {
                Invoke-DockerComposeCommand @("exec","redis","rm","-f",$redisTemp) | Out-Null
                $dockerMeta.redis = "docker/redis_data.tar.gz"
            }
        }

        $ollamaTemp = "/tmp/anclora_ollama.tar.gz"
        if (Invoke-DockerComposeCommand @("exec","ollama","bash","-lc","tar czf $ollamaTemp -C /root .ollama") -eq 0) {
            $ollamaFile = Join-Path $dockerDir "ollama_data.tar.gz"
            if (Copy-FromContainer "ollama" $ollamaTemp $ollamaFile -eq 0) {
                Invoke-DockerComposeCommand @("exec","ollama","rm","-f",$ollamaTemp) | Out-Null
                $dockerMeta.ollama = "docker/ollama_data.tar.gz"
            }
        }
    }
}

if ($dockerMeta.Keys.Count -gt 0) {
    $meta.docker = $dockerMeta
}

$meta | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $tempDir "_meta.json") -Encoding UTF8

Write-Info "[backup] Comprimiendo..."
Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $archivePath -CompressionLevel Optimal -Force

Write-Host "[backup] Backup creado: $archivePath" -ForegroundColor Green

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue


