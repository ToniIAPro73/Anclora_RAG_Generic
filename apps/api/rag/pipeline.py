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
    
    # Deshabilitar check de compatibilidad por incompatibilidad de versiones
    kwargs = {"prefer_grpc": False}
    
    return QdrantClient(
        url=qdrant_url, 
        api_key=qdrant_api_key if qdrant_api_key else None,
        **kwargs
    )

def index_text(doc_id: str, text: str) -> int:
    try:
        document = Document(text=text, id_=doc_id)
        qdrant_client = get_qdrant_client()
        
        vector_store = QdrantVectorStore(
            client=qdrant_client,
            collection_name="documents",
            # No verificar existencia - asumimos que existe
            force_disable_check_same_thread=True
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