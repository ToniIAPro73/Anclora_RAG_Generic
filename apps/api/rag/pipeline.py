import os
import logging
from typing import List
from llama_index.core import Document, VectorStoreIndex, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Initialize settings
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

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
        # Create a Document object
        document = Document(text=text, id_=doc_id)

        # Initialize Qdrant vector store
        qdrant_client = get_qdrant_client()
        vector_store = QdrantVectorStore(
            client=qdrant_client,
            collection_name="documents"
        )

        # Create index with the document
        # The index will automatically chunk the text using default settings        
        index = VectorStoreIndex.from_documents(
            [document],
            vector_store=vector_store
        )

        # Get the number of nodes/chunks that were created
        # We need to refresh the vector store to get updated stats
        collection_info = qdrant_client.get_collection("documents")
        chunk_count = collection_info.points_count

        logger.info(f"Successfully indexed document {doc_id} with {chunk_count} chunks")
        return chunk_count

    except Exception as e:
        logger.error(f"Error indexing document {doc_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to index document: {str(e)}")
