from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import logging

from llama_index.core import VectorStoreIndex, Settings
from llama_index.llms.ollama import Ollama
from llama_index.vector_stores.qdrant import QdrantVectorStore

from rag.pipeline import EMBED_MODEL, get_qdrant_client, COLLECTION_NAME
from deps import require_viewer_or_admin

logger = logging.getLogger(__name__)
router = APIRouter(tags=["query"])

OLLAMA_URL = os.getenv("OLLAMA_URL") or os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")


class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    language: Optional[str] = "es"


class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[Dict[str, Any]]
    metadata: Dict[str, Any]


def normalize_language(language: Optional[str]) -> str:
    if not language:
        return "es"
    normalized = language.lower()
    if normalized.startswith("en"):
        return "en"
    return "es"


def build_system_prompt(language: str) -> str:
    if language == "en":
        return (
            "You are Anclora's retrieval assistant. By default, craft responses in English "
            "with a professional yet accessible tone. If the user explicitly requests another "
            "language, comply with that instruction immediately."
        )
    return (
        "Eres el asistente de recuperación de Anclora. Responde por defecto en español con un tono "
        "profesional y claro. Si el usuario solicita explícitamente otro idioma, cumple esa petición "
        "de inmediato."
    )


def get_query_engine(top_k: int, language: str):
    """Initialize query engine per request."""
    try:
        llm = Ollama(
            model=OLLAMA_MODEL,
            base_url=OLLAMA_URL,
            request_timeout=120.0,
            system_prompt=build_system_prompt(language),
        )
        Settings.llm = llm
        Settings.embed_model = EMBED_MODEL

        client = get_qdrant_client()
        vector_store = QdrantVectorStore(client=client, collection_name=COLLECTION_NAME)

        index = VectorStoreIndex.from_vector_store(vector_store)
        return index.as_query_engine(similarity_top_k=top_k)

    except Exception as exc:
        logger.error("Query engine error: %s", exc)
        raise


@router.get("/query")
async def query_get(
    query: str,
    language: Optional[str] = "es",
    _: None = Depends(require_viewer_or_admin),
) -> QueryResponse:
    return await query_documents(QueryRequest(query=query, language=language))


@router.post("/query")
async def query_post(
    request: QueryRequest,
    _: None = Depends(require_viewer_or_admin),
) -> QueryResponse:
    return await query_documents(request)


async def query_documents(request: QueryRequest) -> QueryResponse:
    try:
        language = normalize_language(request.language)
        engine = get_query_engine(request.top_k or 5, language)
        llama_response = engine.query(request.query)

        sources: List[Dict[str, Any]] = []
        if hasattr(llama_response, "source_nodes"):
            for node in llama_response.source_nodes:
                score = getattr(node, "score", None)
                sources.append(
                    {
                        "text": node.node.text[:200],
                        "score": float(score) if score is not None else None,
                        "metadata": getattr(node.node, "metadata", {}),
                    }
                )

        answer_text = getattr(llama_response, "response", None)
        if not answer_text and hasattr(llama_response, "message"):
            answer_text = getattr(llama_response, "message")
        if not answer_text:
            answer_text = str(llama_response)

        metadata: Dict[str, Any] = {
            "model": OLLAMA_MODEL,
            "sources": len(sources),
            "language": language,
        }
        llama_metadata = getattr(llama_response, "metadata", None)
        if isinstance(llama_metadata, dict):
            metadata.update(llama_metadata)

        return QueryResponse(
            query=request.query,
            answer=str(answer_text),
            sources=sources,
            metadata=metadata,
        )

    except Exception as exc:
        logger.error("Query error: %s", exc)
        raise HTTPException(500, detail=str(exc))
