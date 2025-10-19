import logging
import os
import types
from typing import Optional, Dict, Any

from fastapi import HTTPException
from llama_index.core import Document, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.http.models import Distance, VectorParams, Filter, FieldCondition, MatchValue

logger = logging.getLogger(__name__)

# Configuración global de embeddings
EMBED_MODEL = HuggingFaceEmbedding(
    model_name="nomic-ai/nomic-embed-text-v1.5",
    trust_remote_code=True,
)
NODE_PARSER = SentenceSplitter(chunk_size=512, chunk_overlap=80)
Settings.embed_model = EMBED_MODEL
Settings.node_parser = NODE_PARSER

COLLECTION_NAME = "documents"
EMBED_DIMENSION = 768  # Dimensión del modelo nomic-embed-text-v1.5


def get_qdrant_client() -> QdrantClient:
    """Initialise Qdrant client with environment settings."""
    qdrant_url = os.getenv("QDRANT_URL", "http://qdrant:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")

    client = QdrantClient(
        url=qdrant_url,
        api_key=qdrant_api_key if qdrant_api_key else None,
        prefer_grpc=False,
        timeout=30,
        check_compatibility=False,
    )

    _patch_collection_exists(client)

    return client


def _patch_collection_exists(client: QdrantClient) -> None:
    """Add backwards-compatible fallback for collection existence checks."""
    original_exists = client.collection_exists

    # Avoid double patching
    if getattr(original_exists, "__dict__", {}).get("_anclora_patch"):
        return

    def safe_collection_exists(self: QdrantClient, collection_name: str, **kwargs) -> bool:
        try:
            return original_exists(collection_name=collection_name, **kwargs)
        except UnexpectedResponse as exc:
            if exc.status_code == 404:
                try:
                    self.get_collection(collection_name=collection_name)
                except UnexpectedResponse as inner_exc:
                    if inner_exc.status_code == 404:
                        return False
                    raise
                return True
            raise

    safe_collection_exists.__dict__["_anclora_patch"] = True  # type: ignore[attr-defined]
    client.collection_exists = types.MethodType(safe_collection_exists, client)


def ensure_collection(client: QdrantClient, collection_name: str) -> None:
    """Create the target collection in Qdrant if it does not exist yet."""
    logger.info("Ensuring Qdrant collection '%s' exists", collection_name)
    collections = client.get_collections().collections or []
    if any(col.name == collection_name for col in collections):
        logger.info("Collection '%s' already present", collection_name)
        return

    logger.info("Creating missing Qdrant collection '%s'", collection_name)
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=EMBED_DIMENSION,
            distance=Distance.COSINE,
        ),
    )


def check_duplicate_document(content_hash: str) -> Optional[Dict[str, Any]]:
    """
    Check if a document with the given content hash already exists in Qdrant.

    Args:
        content_hash: SHA-256 hash of the document content

    Returns:
        Dictionary with duplicate info if found, None otherwise.
        Contains: original_filename, chunks, uploaded_at
    """
    try:
        qdrant_client = get_qdrant_client()

        # Check if collection exists
        if not qdrant_client.collection_exists(COLLECTION_NAME):
            logger.debug("Collection does not exist yet, no duplicates possible")
            return None

        # Search for points with this content_hash
        scroll_result = qdrant_client.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="content_hash",
                        match=MatchValue(value=content_hash)
                    )
                ]
            ),
            limit=1,
            with_payload=True,
            with_vectors=False,
        )

        points, _ = scroll_result

        if points:
            # Found duplicate
            payload = points[0].payload or {}
            duplicate_info = {
                "original_filename": payload.get("document_id", "unknown"),
                "chunks": 0,  # Will be counted below
                "uploaded_at": payload.get("uploaded_at"),
            }

            # Count all chunks for this content_hash
            count_result = qdrant_client.count(
                collection_name=COLLECTION_NAME,
                count_filter=Filter(
                    must=[
                        FieldCondition(
                            key="content_hash",
                            match=MatchValue(value=content_hash)
                        )
                    ]
                ),
                exact=True,
            )

            duplicate_info["chunks"] = count_result.count

            logger.info(f"Duplicate found for hash {content_hash[:16]}... - {duplicate_info['chunks']} chunks")
            return duplicate_info

        return None

    except Exception as exc:
        logger.warning(f"Error checking for duplicates: {exc}")
        # Don't fail ingestion if duplicate check fails, just proceed
        return None


def index_text(doc_id: str, text: str, content_hash: Optional[str] = None) -> int:
    try:
        from datetime import datetime, timezone

        # Add timestamp metadata to document
        timestamp = datetime.now(timezone.utc).isoformat()

        # Build metadata
        metadata = {
            "document_id": doc_id,
            "uploaded_at": timestamp,
        }

        # Add content hash if provided
        if content_hash:
            metadata["content_hash"] = content_hash

        document = Document(
            text=text,
            id_=doc_id,
            metadata=metadata
        )
        qdrant_client = get_qdrant_client()

        ensure_collection(qdrant_client, COLLECTION_NAME)

        vector_store = QdrantVectorStore(
            client=qdrant_client,
            collection_name=COLLECTION_NAME,
            force_disable_check_same_thread=True,
        )

        nodes = NODE_PARSER.get_nodes_from_documents([document])
        texts = [node.get_content(metadata_mode="all") for node in nodes]
        embeddings = EMBED_MODEL.get_text_embedding_batch(texts)

        # Add metadata to each node
        for idx, (node, embedding) in enumerate(zip(nodes, embeddings)):
            node.embedding = embedding
            # Preserve and enrich metadata
            node.metadata["document_id"] = doc_id
            node.metadata["uploaded_at"] = timestamp
            node.metadata["chunk_index"] = idx
            if content_hash:
                node.metadata["content_hash"] = content_hash

        vector_store.add(nodes)

        # Count chunks for this specific document
        chunk_count = len(nodes)

        logger.info("Successfully indexed document %s with %s chunks at %s", doc_id, chunk_count, timestamp)
        return chunk_count

    except Exception as exc:
        logger.error("Error indexing document %s: %s", doc_id, exc)
        raise HTTPException(status_code=500, detail=f"Failed to index document: {exc}") from exc
