from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import logging

# LlamaIndex imports (versión 0.14+)
from llama_index.core import VectorStoreIndex, Settings
from llama_index.llms.ollama import Ollama
from llama_index.vector_stores.qdrant import QdrantVectorStore

from rag.pipeline import EMBED_MODEL, get_qdrant_client, COLLECTION_NAME

logger = logging.getLogger(__name__)
router = APIRouter(tags=["query"])

# Configuración
OLLAMA_URL = os.getenv("OLLAMA_URL") or os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

class QueryResponse(BaseModel):
    query: str
    response: str
    sources: List[Dict[str, Any]]
    metadata: Dict[str, Any]

def get_query_engine(top_k: int):
    """Initialize query engine."""
    try:
        llm = Ollama(model=OLLAMA_MODEL, base_url=OLLAMA_URL, request_timeout=120.0)
        Settings.llm = llm
        Settings.embed_model = EMBED_MODEL

        client = get_qdrant_client()
        vector_store = QdrantVectorStore(client=client, collection_name=COLLECTION_NAME)

        index = VectorStoreIndex.from_vector_store(vector_store)
        return index.as_query_engine(similarity_top_k=top_k)

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
        engine = get_query_engine(request.top_k or 5)
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
            metadata={"model": OLLAMA_MODEL, "sources": len(sources)}
        )
        
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(500, detail=str(e))
