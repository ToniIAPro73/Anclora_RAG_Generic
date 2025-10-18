# Script para detener el entorno de desarrollo completo
# Uso: .\scripts\powershell\stop_dev.ps1

Write-Host "=== Deteniendo Anclora RAG Development Stack ===" -ForegroundColor Cyan

# 1. Detener frontend Next.js
Write-Host "`n[1/2] Deteniendo frontend Next.js..." -ForegroundColor Yellow
try {
    npx kill-port 3030 2>$null
    Write-Host "✓ Frontend detenido" -ForegroundColor Green
} catch {
    Write-Host "✓ Frontend no estaba corriendo" -ForegroundColor Gray
}

# Detener job de PowerShell si existe
Get-Job -Name "NextJS-Dev" -ErrorAction SilentlyContinue | Stop-Job | Remove-Job

# 2. Detener servicios Docker
Write-Host "`n[2/2] Deteniendo servicios Docker..." -ForegroundColor Yellow
docker compose -f infra/docker/docker-compose.dev.yml down

Write-Host "`n=== Stack de Desarrollo Detenido ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para reiniciar:" -ForegroundColor Cyan
Write-Host "  .\scripts\powershell\start_dev.ps1" -ForegroundColor White
Write-Host ""
