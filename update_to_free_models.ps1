<#
.SYNOPSIS
    Migración a modelos gratuitos (nomic-embed-text-v1.5)
.DESCRIPTION
    Actualiza requirements.txt, pipeline.py, .env y reconstruye el contenedor API
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🔄 Migrando a modelos gratuitos..." -ForegroundColor Cyan

# Rutas base (el script está en la raíz del proyecto)
$repoRoot = $PSScriptRoot
$apiDir = Join-Path $repoRoot "apps\api"
$infraDir = Join-Path $repoRoot "infra\docker"
$requirementsPath = Join-Path $apiDir "requirements.txt"
$pipelinePath = Join-Path $apiDir "rag\pipeline.py"
$envPath = Join-Path $repoRoot ".env"

# Validar rutas críticas
if (-not (Test-Path $apiDir)) {
    throw "No se encuentra el directorio de API: $apiDir"
}
if (-not (Test-Path $requirementsPath)) {
    throw "No se encuentra requirements.txt: $requirementsPath"
}

# 1. Actualizar requirements.txt
Write-Host "`n📦 Actualizando requirements.txt..." -ForegroundColor Yellow
$newDeps = @"

# Modelos de embedding gratuitos
llama-index-embeddings-huggingface==0.4.0
sentence-transformers==3.3.1
torch==2.5.1
"@

Add-Content -Path $requirementsPath -Value $newDeps
Write-Host "✅ Dependencias añadidas" -ForegroundColor Green

# 2. Reemplazar pipeline.py
Write-Host "`n🔧 Actualizando pipeline.py..." -ForegroundColor Yellow
$pipelineContent = @'
import os
import logging
from typing import Any, List, Optional

from llama_index.core import Document, VectorStoreIndex, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Modelo de embedding gratuito y de alto rendimiento (según arquitectura documentada)
EMBED_MODEL = HuggingFaceEmbedding(
    model_name="nomic-ai/nomic-embed-text-v1.5",
    trust_remote_code=True
)
Settings.embed_model = EMBED_MODEL

def get_qdrant_client() -> QdrantClient:
    """Initialize Qdrant client with environment settings."""
    qdrant_url = os.getenv("QDRANT_URL", "http://qdrant:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    
    return QdrantClient(url=qdrant_url, api_key=qdrant_api_key) if qdrant_api_key else QdrantClient(url=qdrant_url)

def index_text(doc_id: str, text: str) -> int:
    """
    Index text document into the vector database.

    Args:
        doc_id: Unique identifier for the document
        text: Text content to be indexed

    Returns:
        Number of chunks created and indexed
    """
    try:
        document = Document(text=text, id_=doc_id)
        qdrant_client = get_qdrant_client()
        
        vector_store = QdrantVectorStore(
            client=qdrant_client,
            collection_name="documents"
        )

        index = VectorStoreIndex.from_documents(
            [document],
            vector_store=vector_store
        )

        collection_info = qdrant_client.get_collection("documents")
        chunk_count = collection_info.points_count

        logger.info(f"Successfully indexed document {doc_id} with {chunk_count} chunks")
        return chunk_count

    except Exception as e:
        logger.error(f"Error indexing document {doc_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to index document: {str(e)}")
'@

Set-Content -Path $pipelinePath -Value $pipelineContent -Encoding UTF8
Write-Host "✅ pipeline.py actualizado" -ForegroundColor Green

# 3. Limpiar .env de referencias a OpenAI
Write-Host "`n🔐 Actualizando .env..." -ForegroundColor Yellow
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath | Where-Object { $_ -notmatch "OPENAI_API_KEY" }
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Host "✅ Referencias a OpenAI eliminadas" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env no existe, creando..." -ForegroundColor Yellow
    @"
QDRANT_URL=http://qdrant:6333
"@ | Set-Content -Path $envPath -Encoding UTF8
    Write-Host "✅ .env creado" -ForegroundColor Green
}

# 4. Docker compose
Write-Host "`n🐳 Reconstruyendo contenedores..." -ForegroundColor Yellow
Push-Location $infraDir

try {
    Write-Host "  → Deteniendo contenedores..." -ForegroundColor DarkGray
    docker compose -f docker-compose.dev.yml down 2>$null

    Write-Host "  → Reconstruyendo API (sin caché)..." -ForegroundColor DarkGray
    docker compose -f docker-compose.dev.yml build --no-cache api

    Write-Host "  → Iniciando stack completo..." -ForegroundColor DarkGray
    docker compose -f docker-compose.dev.yml up -d

    Write-Host "`n✅ Stack iniciado en segundo plano" -ForegroundColor Green
    Write-Host "`n📊 Logs en tiempo real:" -ForegroundColor Cyan
    Write-Host "   docker compose -f infra/docker/docker-compose.dev.yml logs -f api" -ForegroundColor DarkGray
    
    Write-Host "`n🔍 Verificar salud:" -ForegroundColor Cyan
    Write-Host "   curl http://localhost:8000/health" -ForegroundColor DarkGray
    
    Write-Host "`n⚠️  NOTA: Primera ejecución descargará nomic-embed-text-v1.5 (~500MB)" -ForegroundColor Yellow
    Write-Host "   Esto solo ocurre una vez, el modelo se cachea en:" -ForegroundColor DarkGray
    Write-Host "   $env:USERPROFILE\.cache\huggingface" -ForegroundColor DarkGray

} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

Write-Host "`n🎯 Migración completada exitosamente" -ForegroundColor Green