import logging
import os
import types

from fastapi import HTTPException
from llama_index.core import Document, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.http.models import Distance, VectorParams

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


def index_text(doc_id: str, text: str) -> int:
    try:
        from datetime import datetime, timezone

        # Add timestamp metadata to document
        timestamp = datetime.now(timezone.utc).isoformat()
        document = Document(
            text=text,
            id_=doc_id,
            metadata={
                "document_id": doc_id,
                "uploaded_at": timestamp,
            }
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

        vector_store.add(nodes)

        # Count chunks for this specific document
        chunk_count = len(nodes)

        logger.info("Successfully indexed document %s with %s chunks at %s", doc_id, chunk_count, timestamp)
        return chunk_count

    except Exception as exc:
        logger.error("Error indexing document %s: %s", doc_id, exc)
        raise HTTPException(status_code=500, detail=f"Failed to index document: {exc}") from exc
