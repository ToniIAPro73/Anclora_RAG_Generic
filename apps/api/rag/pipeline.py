import os
import logging
from typing import Any, List, Optional

Settings: Optional[Any] = None
try:
    from llama_index.core import Document, VectorStoreIndex, Settings as CoreSettings
    from llama_index.core.node_parser import SentenceSplitter
    from llama_index.embeddings.huggingface import HuggingFaceEmbedding
    Settings = CoreSettings
except ImportError:
    from llama_index import Document, VectorStoreIndex
    from llama_index.node_parser import SentenceSplitter
    from llama_index.embeddings import HuggingFaceEmbedding

try:
    from llama_index.vector_stores.qdrant import QdrantVectorStore
except ImportError:
    try:
        from llama_index.core.vector_stores import QdrantVectorStore
    except ImportError:
        QdrantVectorStore = None

from qdrant_client import QdrantClient
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# 🆓 MODELO DE EMBEDDINGS LOCAL Y GRATUITO
EMBED_MODEL = HuggingFaceEmbedding(
    model_name="nomic-ai/nomic-embed-text-v1.5",
    cache_folder="./models"  # Cache local
)

if Settings is not None:
    try:
        Settings.embed_model = EMBED_MODEL
    except AttributeError:
        logger.debug("LlamaIndex Settings does not expose embed_model; continuing with defaults.")


def get_qdrant_client() -> QdrantClient:
    """Initialize Qdrant client with environment settings."""
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    
    if qdrant_api_key:
        client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    else:
        client = QdrantClient(url=qdrant_url)
    
    return client


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
        if QdrantVectorStore is None:
            raise HTTPException(
                status_code=500,
                detail="QdrantVectorStore not available. Please check llama-index installation."
            )
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
