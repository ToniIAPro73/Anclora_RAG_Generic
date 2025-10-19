import asyncio
import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from google.genai.types import Content, GenerateContentConfig, HttpOptions, Part
from llama_index.core import Settings, VectorStoreIndex
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.vector_stores.qdrant import QdrantVectorStore
from pydantic import BaseModel, Field, field_validator

from deps import require_viewer_or_admin
from rag.pipeline import COLLECTION_NAME, EMBED_MODEL, get_qdrant_client

logger = logging.getLogger(__name__)
router = APIRouter(tags=["query"])

# Gemini settings (cloud LLM, free tier)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-1.5-flash")
GEMINI_API_BASE = os.getenv("GEMINI_API_BASE")


def sanitize_api_base(api_base: Optional[str]) -> Optional[str]:
    if not api_base:
        return None
    cleaned = api_base.rstrip("/")
    for suffix in ("/v1beta", "/v1"):
        if cleaned.endswith(suffix):
            cleaned = cleaned[: -len(suffix)]
    return cleaned


SANITIZED_API_BASE = sanitize_api_base(GEMINI_API_BASE)
if GEMINI_API_KEY and GEMINI_MODEL:
    logger.info(
        "Gemini config loaded - model=%s api_base=%s",
        GEMINI_MODEL,
        SANITIZED_API_BASE or "default",
    )


class QueryRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = Field(None, description="Alias for 'query' field for compatibility")
    top_k: Optional[int] = 5
    language: Optional[str] = "es"

    @field_validator("query", mode="before")
    @classmethod
    def set_query_from_question(cls, v, info):
        """Accept both 'query' and 'question' fields for compatibility."""
        # If query is not provided but question is, use question as query
        if v is None and info.data.get("question"):
            return info.data.get("question")
        return v

    def model_post_init(self, __context):
        """Ensure query field is set after validation."""
        if self.query is None and self.question is not None:
            self.query = self.question
        elif self.query is None:
            raise ValueError("Either 'query' or 'question' field must be provided")


class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[Dict[str, Any]]
    citations: Optional[List[Dict[str, Any]]] = Field(None, description="Alias for 'sources' field")
    metadata: Dict[str, Any]

    def model_post_init(self, __context):
        """Set citations as alias for sources."""
        if self.citations is None:
            self.citations = self.sources


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
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY not configured. Please add it to your .env file.\n"
                "Get your free API key at: https://aistudio.google.com/app/apikey"
            )

        model_name = GEMINI_MODEL
        if "/" not in model_name:
            model_name = f"models/{model_name}"

        system_prompt = build_system_prompt(language)
        llm_kwargs: Dict[str, Any] = {
            "model": model_name,
            "api_key": GEMINI_API_KEY,
            "temperature": 0.7,
        }
        if system_prompt:
            llm_kwargs["generation_config"] = GenerateContentConfig(
                system_instruction=Content(role="system", parts=[Part(text=system_prompt)])
            )
        if SANITIZED_API_BASE:
            llm_kwargs["http_options"] = HttpOptions(
                base_url=SANITIZED_API_BASE,
                api_version="v1",
            )
        llm_kwargs["use_file_api"] = False

        llm = GoogleGenAI(**llm_kwargs)
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
        top_k = request.top_k or 5

        logger.info(f"Processing query: {len(request.query)} chars, language={language}, top_k={top_k}")

        engine = get_query_engine(top_k, language)
        llama_response = await asyncio.to_thread(engine.query, request.query)

        sources: List[Dict[str, Any]] = []
        if hasattr(llama_response, "source_nodes"):
            for node in llama_response.source_nodes:
                score = getattr(node, "score", None)
                node_metadata = getattr(node.node, "metadata", {})

                # Build source entry with all expected fields
                source_entry = {
                    "text": node.node.text[:200],
                    "score": float(score) if score is not None else None,
                    "metadata": node_metadata,
                    "source": node_metadata.get("filename", node_metadata.get("file_name", "unknown")),  # Add 'source' field for compatibility
                }

                # Add page/chunk_id if available in metadata
                if "page" in node_metadata:
                    source_entry["page"] = node_metadata["page"]
                if "chunk_id" in node_metadata:
                    source_entry["chunk_id"] = node_metadata["chunk_id"]

                sources.append(source_entry)

        answer_text = getattr(llama_response, "response", None)
        if not answer_text and hasattr(llama_response, "message"):
            answer_text = getattr(llama_response, "message")
        if not answer_text:
            answer_text = str(llama_response)

        metadata: Dict[str, Any] = {
            "model": GEMINI_MODEL,
            "sources": len(sources),
            "language": language,
        }
        llama_metadata = getattr(llama_response, "metadata", None)
        if isinstance(llama_metadata, dict):
            metadata.update(llama_metadata)

        logger.info(
            f"Query completed: {len(str(answer_text))} chars, {len(sources)} sources, language={language}"
        )

        return QueryResponse(
            query=request.query,
            answer=str(answer_text),
            sources=sources,
            metadata=metadata,
        )

    except Exception as exc:
        logger.error(f"Query processing failed: {request.query[:50]}... - {str(exc)}", exc_info=True)
        raise HTTPException(500, detail=str(exc))
