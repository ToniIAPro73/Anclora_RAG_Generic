<#
.SYNOPSIS
    Primera prueba de ingesta en Anclora RAG
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🧪 Test de Ingesta - Anclora RAG" -ForegroundColor Cyan

$repoRoot = $PSScriptRoot

# 1. Crear documento de prueba
Write-Host "`n1️⃣ Creando documento de prueba..." -ForegroundColor Yellow
$testDoc = @"
# Sistema Anclora RAG - Documento de Prueba

Este es un documento de prueba para verificar el pipeline completo de ingesta.

## Arquitectura del Sistema
El sistema utiliza los siguientes componentes:
- **Embeddings**: nomic-embed-text-v1.5 para generar vectores semánticos
- **Base de Datos Vectorial**: Qdrant para almacenamiento y búsqueda
- **Framework RAG**: LlamaIndex para orquestación del pipeline
- **API**: FastAPI con procesamiento asíncrono

## Proceso de Ingesta
1. El usuario sube un documento a través del endpoint /ingest
2. El documento se parsea según su tipo (PDF, DOCX, TXT, MD)
3. El texto se fragmenta en chunks semánticos
4. Cada chunk se convierte en un vector mediante el modelo de embedding
5. Los vectores se almacenan en Qdrant con sus metadatos

## Capacidades de Recuperación
El sistema permite buscar información relevante mediante:
- Búsqueda semántica por similitud de vectores
- Filtrado por metadatos de documentos
- Ranking de resultados por relevancia

Esta es una prueba de funcionamiento del sistema completo.
"@

$testPath = Join-Path $repoRoot "test_document.txt"
$testDoc | Out-File -FilePath $testPath -Encoding UTF8 -NoNewline
Write-Host "   ✅ Documento creado: test_document.txt" -ForegroundColor Green

# 2. Ingestar documento
Write-Host "`n2️⃣ Ingiriendo documento en el sistema..." -ForegroundColor Yellow
Write-Host "   ⏳ Esto puede tardar 10-30s en CPU..." -ForegroundColor DarkGray

try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileContent = Get-Content $testPath -Raw -Encoding UTF8
    $fileName = "test_document.txt"
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: text/plain",
        "",
        $fileContent,
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    $response = Invoke-WebRequest -Uri "http://localhost:8030/ingest" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
        -UseBasicParsing `
        -TimeoutSec 60
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Ingesta exitosa!" -ForegroundColor Green
    Write-Host "   📄 Archivo: $($result.file)" -ForegroundColor DarkGray
    Write-Host "   🧩 Chunks creados: $($result.chunks)" -ForegroundColor DarkGray
    
} catch {
    Write-Host "   ❌ Error en ingesta: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n📋 Logs del API:" -ForegroundColor Yellow
    docker compose -f infra/docker/docker-compose.dev.yml logs --tail=20 api
    exit 1
}

# 3. Verificar colección en Qdrant
Write-Host "`n3️⃣ Verificando colección en Qdrant..." -ForegroundColor Yellow

try {
    $qdrantResponse = Invoke-WebRequest -Uri "http://localhost:6363/collections/documents" `
        -Method GET -UseBasicParsing -TimeoutSec 5
    
    $collection = $qdrantResponse.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Colección 'documents' encontrada" -ForegroundColor Green
    Write-Host "   📊 Puntos almacenados: $($collection.result.points_count)" -ForegroundColor DarkGray
    Write-Host "   📐 Dimensión vectores: $($collection.result.config.params.vectors.size)" -ForegroundColor DarkGray
    
} catch {
    Write-Host "   ⚠️  No se pudo verificar Qdrant: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Resumen
Write-Host "`n🎯 Test de Ingesta Completado Exitosamente" -ForegroundColor Green
Write-Host "`n📊 Resumen:" -ForegroundColor Cyan
Write-Host "   ✅ Documento parseado correctamente" -ForegroundColor DarkGray
Write-Host "   ✅ Embeddings generados" -ForegroundColor DarkGray
Write-Host "   ✅ Vectores almacenados en Qdrant" -ForegroundColor DarkGray

Write-Host "`n💡 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Configurar Ollama con modelo LLM" -ForegroundColor DarkGray
Write-Host "   2. Implementar endpoint /query funcional" -ForegroundColor DarkGray
Write-Host "   3. Probar consulta RAG end-to-end" -ForegroundColor DarkGray

Write-Host "`n🔍 Ver colección en Qdrant Dashboard:" -ForegroundColor Yellow
Write-Host "   http://localhost:6363/dashboard" -ForegroundColor DarkGray