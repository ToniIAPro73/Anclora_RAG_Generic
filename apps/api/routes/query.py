import asyncio
import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from llama_index.core import Settings, VectorStoreIndex, PromptTemplate
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.vector_stores.qdrant import QdrantVectorStore
from pydantic import BaseModel, Field, field_validator

from deps import require_viewer_or_admin
from rag.pipeline import COLLECTION_NAME, EMBED_MODEL, get_qdrant_client

logger = logging.getLogger(__name__)
router = APIRouter(tags=["query"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.0-flash")


def normalize_model_name(model: str) -> str:
    if not model:
        return "models/gemini-2.0-flash"
    if "/" not in model:
        return f"models/{model}"
    return model


class QueryRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = Field(None, description="Alias for 'query' field for compatibility")
    top_k: Optional[int] = 5
    language: Optional[str] = "es"

    @field_validator("query", mode="before")
    @classmethod
    def set_query_from_question(cls, v, info):
        if v is None and info.data.get("question"):
            return info.data.get("question")
        return v

    def model_post_init(self, __context):
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
        if self.citations is None:
            self.citations = self.sources


def normalize_language(language: Optional[str]) -> str:
    if not language:
        return "es"
    normalized = language.lower()
    if normalized.startswith("en"):
        return "en"
    return "es"


def get_query_engine(top_k: int, language: str):
    try:
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY not configured. Please add it to your .env file.\n"
                "Get your free API key at: https://aistudio.google.com/app/apikey"
            )

        # Prepare language-specific prompts
        if language == "es":
            qa_prompt_tmpl_str = (
                "A continuación se proporciona información de contexto.\n"
                "---------------------\n"
                "{context_str}\n"
                "---------------------\n"
                "Dada la información de contexto y sin conocimiento previo, "
                "responde a la consulta en ESPAÑOL de manera profesional y clara.\n"
                "Si la información no está en el contexto, di que no puedes responder basándote en el contexto proporcionado.\n"
                "Consulta: {query_str}\n"
                "Respuesta en español: "
            )
        else:
            qa_prompt_tmpl_str = (
                "Context information is below.\n"
                "---------------------\n"
                "{context_str}\n"
                "---------------------\n"
                "Given the context information and no prior knowledge, "
                "answer the query in ENGLISH in a professional and clear manner.\n"
                "If the information is not in the context, say you cannot answer based on the provided context.\n"
                "Query: {query_str}\n"
                "Answer in English: "
            )

        qa_prompt = PromptTemplate(qa_prompt_tmpl_str)

        llm = GoogleGenAI(
            model=normalize_model_name(GEMINI_MODEL),
            api_key=GEMINI_API_KEY,
            temperature=0.7,
            use_file_api=False,
        )
        Settings.llm = llm
        Settings.embed_model = EMBED_MODEL

        client = get_qdrant_client()
        vector_store = QdrantVectorStore(client=client, collection_name=COLLECTION_NAME)

        index = VectorStoreIndex.from_vector_store(vector_store)
        query_engine = index.as_query_engine(
            similarity_top_k=top_k,
            text_qa_template=qa_prompt,
        )

        return query_engine

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

        logger.info(
            "Processing query: %d chars, language=%s, top_k=%d",
            len(request.query or ""),
            language,
            top_k,
        )

        engine = get_query_engine(top_k, language)
        llama_response = await asyncio.to_thread(engine.query, request.query)

        sources: List[Dict[str, Any]] = []
        if hasattr(llama_response, "source_nodes"):
            for node in llama_response.source_nodes:
                score = getattr(node, "score", None)
                node_metadata = getattr(node.node, "metadata", {})

                source_entry = {
                    "text": node.node.text[:200],
                    "score": float(score) if score is not None else None,
                    "metadata": node_metadata,
                    "source": node_metadata.get("filename", node_metadata.get("file_name", "unknown")),
                }

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
            "Query completed: %d chars, %d sources, language=%s",
            len(str(answer_text)),
            len(sources),
            language,
        )

        return QueryResponse(
            query=request.query,
            answer=str(answer_text),
            sources=sources,
            metadata=metadata,
        )

    except Exception as exc:
        logger.error(
            "Query processing failed: %s... - %s",
            (request.query or "")[:50],
            str(exc),
            exc_info=True,
        )
        raise HTTPException(500, detail=str(exc))
