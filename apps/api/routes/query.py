from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import logging

# LlamaIndex imports (versión 0.14+)
from llama_index.core import VectorStoreIndex, Settings, StorageContext
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.ollama import Ollama
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

logger = logging.getLogger(__name__)
router = APIRouter(tags=["query"])

# Configuración
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
COLLECTION_NAME = "documents"

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

class QueryResponse(BaseModel):
    query: str
    response: str
    sources: List[Dict[str, Any]]
    metadata: Dict[str, Any]

def get_query_engine():
    """Initialize query engine."""
    try:
        # LLM y embeddings
        llm = Ollama(model="llama3.2", base_url=OLLAMA_URL, request_timeout=120.0)
        embed_model = OpenAIEmbedding(model="text-embedding-3-small")
        
        Settings.llm = llm
        Settings.embed_model = embed_model
        
        # Qdrant
        client = QdrantClient(url=QDRANT_URL)
        vector_store = QdrantVectorStore(client=client, collection_name=COLLECTION_NAME)
        
        # Index
        index = VectorStoreIndex.from_vector_store(vector_store)
        return index.as_query_engine(similarity_top_k=5)
        
    except Exception as e:
        logger.error(f"Query engine error: {e}")
        raise

@router.get("/query")
async def query_get(query: str) -> QueryResponse:
    return await query_documents(QueryRequest(query=query))

@router.post("/query")
async def query_post(request: QueryRequest) -> QueryResponse:
    return await query_documents(request)

async def query_documents(request: QueryRequest) -> QueryResponse:
    try:
        engine = get_query_engine()
        response = engine.query(request.query)
        
        sources = []
        if hasattr(response, 'source_nodes'):
            for node in response.source_nodes:
                sources.append({
                    "text": node.node.text[:200],
                    "score": float(node.score) if hasattr(node, 'score') else None
                })
        
        return QueryResponse(
            query=request.query,
            response=str(response),
            sources=sources,
            metadata={"model": "llama3.2", "sources": len(sources)}
        )
        
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(500, detail=str(e))