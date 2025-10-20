# Script para probar el endpoint waitlist
$body = @{
    email = "test@example.com"
    referral_source = "linkedin"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/waitlist" -Method POST -Body $body -ContentType "application/json"

Write-Host "=== Respuesta del servidor ===" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10

Write-Host "`n=== Verificar en base de datos ===" -ForegroundColor Cyan
docker exec docker-postgres-1 psql -U anclora_user -d anclora_rag -c "SELECT * FROM waitlist;"
