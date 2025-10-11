<#
.SYNOPSIS
    Sistema de backup de Qdrant y datos del proyecto
.DESCRIPTION
    Crea snapshots de Qdrant y backups de volúmenes Docker
#>

param(
    [string]$BackupDir = "backups",
    [switch]$AutoRotate  # Mantener solo últimos 7 backups
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "`n💾 Sistema de Backup Anclora RAG" -ForegroundColor Cyan
Write-Host "Timestamp: $timestamp" -ForegroundColor DarkGray

# Crear directorio de backups
$repoRoot = $PSScriptRoot
$backupPath = Join-Path $repoRoot $BackupDir
$currentBackup = Join-Path $backupPath $timestamp

if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
}
New-Item -ItemType Directory -Path $currentBackup | Out-Null

Write-Host "`n📂 Backup en: $currentBackup" -ForegroundColor Yellow

# 1. Backup de Qdrant (colecciones)
Write-Host "`n1️⃣ Backup de Qdrant..." -ForegroundColor Yellow
try {
    # Crear snapshot en Qdrant
    $response = Invoke-WebRequest -Uri "http://localhost:6363/collections/documents/snapshots" `
        -Method POST -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
        $snapshotInfo = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ Snapshot Qdrant creado" -ForegroundColor Green
        
        # Copiar snapshot del contenedor
        docker cp docker-qdrant-1:/qdrant/storage/collections/documents/snapshots (Join-Path $currentBackup "qdrant_snapshots")
        Write-Host "   ✅ Snapshot exportado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Colección 'documents' no existe aún (normal en instalación nueva)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Qdrant no responde o colección vacía: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Backup de volúmenes Docker
Write-Host "`n2️⃣ Backup de volúmenes Docker..." -ForegroundColor Yellow
$volumes = @("docker_qdrant_data", "docker_redis_data", "docker_ollama_data")

foreach ($vol in $volumes) {
    try {
        $volBackup = Join-Path $currentBackup "$vol.tar"
        docker run --rm -v ${vol}:/source -v ${currentBackup}:/backup alpine tar czf /backup/$vol.tar.gz -C /source . 2>$null
        if ($LASTEXITCODE -eq 0) {
            $size = [math]::Round((Get-Item "$volBackup.gz").Length / 1MB, 2)
            Write-Host "   ✅ $vol → ${size}MB" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  $vol no disponible" -ForegroundColor Yellow
    }
}

# 3. Backup de configuración
Write-Host "`n3️⃣ Backup de configuración..." -ForegroundColor Yellow
Copy-Item (Join-Path $repoRoot ".env") (Join-Path $currentBackup ".env") -ErrorAction SilentlyContinue
Copy-Item (Join-Path $repoRoot "infra\docker\docker-compose.dev.yml") (Join-Path $currentBackup "docker-compose.dev.yml")
Write-Host "   ✅ Configuración respaldada" -ForegroundColor Green

# 4. Metadata del backup
$metadata = @{
    timestamp = $timestamp
    datetime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    qdrant_collections = @("documents")
    volumes = $volumes
} | ConvertTo-Json

$metadata | Out-File (Join-Path $currentBackup "backup_info.json") -Encoding UTF8
Write-Host "   ✅ Metadata guardada" -ForegroundColor Green

# 5. Rotación automática (mantener últimos 7)
if ($AutoRotate) {
    Write-Host "`n♻️  Rotación de backups antiguos..." -ForegroundColor Yellow
    $allBackups = Get-ChildItem $backupPath -Directory | Sort-Object Name -Descending
    if ($allBackups.Count -gt 7) {
        $toDelete = $allBackups | Select-Object -Skip 7
        foreach ($old in $toDelete) {
            Remove-Item $old.FullName -Recurse -Force
            Write-Host "   🗑️  Eliminado: $($old.Name)" -ForegroundColor DarkGray
        }
    }
}

# Resumen
Write-Host "`n✅ Backup completado exitosamente" -ForegroundColor Green
Write-Host "`n📊 Resumen:" -ForegroundColor Cyan
$backupSize = (Get-ChildItem $currentBackup -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   📂 Ubicación: $currentBackup" -ForegroundColor DarkGray
Write-Host "   💾 Tamaño total: $([math]::Round($backupSize, 2))MB" -ForegroundColor DarkGray
Write-Host "   📁 Archivos: $($(Get-ChildItem $currentBackup -Recurse -File).Count)" -ForegroundColor DarkGray

Write-Host "`n💡 Restaurar con: .\restore_backup.ps1 -BackupTimestamp $timestamp" -ForegroundColor Cyan
