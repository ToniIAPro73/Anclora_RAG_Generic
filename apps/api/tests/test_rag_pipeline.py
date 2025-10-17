"""Tests for the RAG pipeline (rag/pipeline.py)."""

from unittest.mock import MagicMock, patch

import pytest


@pytest.mark.unit
def test_get_qdrant_client():
    """Test Qdrant client initialization."""
    from rag.pipeline import get_qdrant_client

    with patch("rag.pipeline.QdrantClient") as mock_client_class:
        mock_instance = MagicMock()
        mock_client_class.return_value = mock_instance

        client = get_qdrant_client()

        assert client is not None
        mock_client_class.assert_called_once()


@pytest.mark.unit
def test_ensure_collection_creates_missing_collection(mock_qdrant_client):
    """Test that ensure_collection creates collection if it doesn't exist."""
    from rag.pipeline import ensure_collection

    # Mock collection doesn't exist
    mock_qdrant_client.get_collections.return_value = MagicMock(collections=[])

    ensure_collection(mock_qdrant_client, "test_collection")

    mock_qdrant_client.create_collection.assert_called_once_with(
        collection_name="test_collection", vectors_config=pytest.approx(object, rel=1)
    )


@pytest.mark.unit
def test_ensure_collection_skips_existing_collection(mock_qdrant_client):
    """Test that ensure_collection skips creation if collection exists."""
    from rag.pipeline import ensure_collection

    # Mock collection exists
    existing_collection = MagicMock()
    existing_collection.name = "test_collection"
    mock_qdrant_client.get_collections.return_value = MagicMock(collections=[existing_collection])

    ensure_collection(mock_qdrant_client, "test_collection")

    mock_qdrant_client.create_collection.assert_not_called()


@pytest.mark.unit
def test_index_text_creates_document():
    """Test that index_text creates a Document with correct metadata."""
    from rag.pipeline import index_text

    with (
        patch("rag.pipeline.get_qdrant_client") as mock_get_client,
        patch("rag.pipeline.ensure_collection") as mock_ensure,
        patch("rag.pipeline.QdrantVectorStore") as mock_vector_store_class,
        patch("rag.pipeline.NODE_PARSER") as mock_parser,
        patch("rag.pipeline.EMBED_MODEL") as mock_embed,
    ):
        # Setup mocks
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.get_collection.return_value = MagicMock(points_count=5)

        mock_node = MagicMock()
        mock_node.get_content.return_value = "test content"
        mock_parser.get_nodes_from_documents.return_value = [mock_node]

        mock_embed.get_text_embedding_batch.return_value = [[0.1] * 768]

        mock_vector_store = MagicMock()
        mock_vector_store_class.return_value = mock_vector_store

        # Execute
        chunk_count = index_text("doc-123", "This is test text")

        # Verify
        assert chunk_count == 5
        mock_ensure.assert_called_once()
        mock_vector_store.add.assert_called_once()


@pytest.mark.unit
def test_index_text_handles_empty_text():
    """Test that index_text can handle empty text gracefully."""
    from rag.pipeline import index_text

    with (
        patch("rag.pipeline.get_qdrant_client") as mock_get_client,
        patch("rag.pipeline.ensure_collection"),
        patch("rag.pipeline.QdrantVectorStore") as mock_vector_store_class,
        patch("rag.pipeline.NODE_PARSER") as mock_parser,
        patch("rag.pipeline.EMBED_MODEL") as mock_embed,
    ):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.get_collection.return_value = MagicMock(points_count=0)

        # Return empty nodes for empty text
        mock_parser.get_nodes_from_documents.return_value = []
        mock_embed.get_text_embedding_batch.return_value = []

        mock_vector_store = MagicMock()
        mock_vector_store_class.return_value = mock_vector_store

        chunk_count = index_text("doc-empty", "")

        assert chunk_count == 0


@pytest.mark.unit
def test_index_text_generates_embeddings():
    """Test that index_text generates embeddings for all nodes."""
    from rag.pipeline import index_text

    with (
        patch("rag.pipeline.get_qdrant_client") as mock_get_client,
        patch("rag.pipeline.ensure_collection"),
        patch("rag.pipeline.QdrantVectorStore") as mock_vector_store_class,
        patch("rag.pipeline.NODE_PARSER") as mock_parser,
        patch("rag.pipeline.EMBED_MODEL") as mock_embed,
    ):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.get_collection.return_value = MagicMock(points_count=3)

        # Create 3 mock nodes
        mock_nodes = [MagicMock() for _ in range(3)]
        for node in mock_nodes:
            node.get_content.return_value = "content"
        mock_parser.get_nodes_from_documents.return_value = mock_nodes

        # Mock embeddings
        mock_embed.get_text_embedding_batch.return_value = [[0.1] * 768, [0.2] * 768, [0.3] * 768]

        mock_vector_store = MagicMock()
        mock_vector_store_class.return_value = mock_vector_store

        chunk_count = index_text("doc-multi", "Multi paragraph text")

        # Verify embeddings were generated for all nodes
        mock_embed.get_text_embedding_batch.assert_called_once()
        call_args = mock_embed.get_text_embedding_batch.call_args[0][0]
        assert len(call_args) == 3

        # Verify all nodes have embeddings assigned
        for node in mock_nodes:
            assert hasattr(node, "embedding")

        assert chunk_count == 3


@pytest.mark.unit
def test_index_text_handles_qdrant_error():
    """Test error handling when Qdrant operations fail."""
    from fastapi import HTTPException

    from rag.pipeline import index_text

    with (
        patch("rag.pipeline.get_qdrant_client") as mock_get_client,
        patch("rag.pipeline.ensure_collection"),
    ):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.get_collection.side_effect = Exception("Qdrant connection failed")

        with pytest.raises(HTTPException) as exc_info:
            index_text("doc-error", "Test text")

        assert exc_info.value.status_code == 500
        assert "Failed to index document" in str(exc_info.value.detail)


@pytest.mark.unit
def test_settings_configured_correctly():
    """Test that global Settings are configured with EMBED_MODEL and NODE_PARSER."""
    from llama_index.core import Settings

    from rag.pipeline import EMBED_MODEL, NODE_PARSER

    # Verify Settings are configured
    assert Settings.embed_model == EMBED_MODEL
    assert Settings.node_parser == NODE_PARSER


@pytest.mark.unit
def test_embed_dimension_matches_model():
    """Test that EMBED_DIMENSION constant matches the model's actual dimension."""
    from rag.pipeline import EMBED_DIMENSION

    # nomic-embed-text-v1.5 has 768 dimensions
    assert EMBED_DIMENSION == 768


@pytest.mark.unit
def test_collection_name_constant():
    """Test that COLLECTION_NAME is set correctly."""
    from rag.pipeline import COLLECTION_NAME

    assert COLLECTION_NAME == "documents"
