<#
.SYNOPSIS
    Inicializa la colección en Qdrant
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🔧 Inicializando colección Qdrant..." -ForegroundColor Cyan

# Configuración de la colección
$collectionConfig = @{
    vectors = @{
        size = 768  # Dimensión de nomic-embed-text-v1.5
        distance = "Cosine"
    }
} | ConvertTo-Json -Depth 10

try {
    # Crear colección
    Write-Host "`n📊 Creando colección 'documents'..." -ForegroundColor Yellow
    
    $response = Invoke-WebRequest -Uri "http://localhost:6363/collections/documents" `
        -Method PUT `
        -ContentType "application/json" `
        -Body $collectionConfig `
        -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Colección creada exitosamente" -ForegroundColor Green
    }
    
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "   ℹ️  Colección ya existe (normal)" -ForegroundColor DarkGray
    } else {
        throw
    }
}

# Verificar colección
Write-Host "`n🔍 Verificando colección..." -ForegroundColor Yellow

try {
    $verifyResponse = Invoke-WebRequest -Uri "http://localhost:6363/collections/documents" `
        -Method GET -UseBasicParsing
    
    $collection = $verifyResponse.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Colección 'documents' configurada" -ForegroundColor Green
    Write-Host "   📐 Dimensión vectores: $($collection.result.config.params.vectors.size)" -ForegroundColor DarkGray
    Write-Host "   📏 Distancia: $($collection.result.config.params.vectors.distance)" -ForegroundColor DarkGray
    Write-Host "   📊 Puntos actuales: $($collection.result.points_count)" -ForegroundColor DarkGray
    
} catch {
    Write-Host "   ❌ Error verificando colección: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Qdrant listo para ingesta" -ForegroundColor Green
Write-Host "💡 Ahora ejecuta: .\test_ingestion.ps1" -ForegroundColor Cyan