"""Tests for the /query endpoint."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
def test_query_post_success(client: TestClient):
    """Test successful POST query."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        mock_response.response = "This is a test answer about the document."
        mock_response.source_nodes = [
            MagicMock(
                node=MagicMock(text="Source text excerpt", metadata={"filename": "test.pdf"}), score=0.95
            )
        ]
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        payload = {"query": "What is this document about?", "top_k": 5, "language": "es"}
        response = client.post("/query", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "query" in data
        assert "answer" in data
        assert "sources" in data
        assert "metadata" in data

        # Verify content
        assert data["query"] == "What is this document about?"
        assert data["answer"] == "This is a test answer about the document."
        assert isinstance(data["sources"], list)
        assert len(data["sources"]) == 1
        assert data["sources"][0]["score"] == 0.95
        assert "metadata" in data["sources"][0]

        # Verify metadata
        assert data["metadata"]["sources"] == 1
        assert data["metadata"]["language"] == "es"


@pytest.mark.unit
def test_query_get_success(client: TestClient):
    """Test successful GET query."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        mock_response.response = "Answer in English"
        mock_response.source_nodes = []
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        response = client.get("/query?query=test+question&language=en")

        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "Answer in English"
        assert data["metadata"]["language"] == "en"


@pytest.mark.unit
def test_query_handles_empty_sources(client: TestClient):
    """Test query with no source nodes."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        mock_response.response = "Answer with no sources"
        mock_response.source_nodes = []
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        payload = {"query": "Test question"}
        response = client.post("/query", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "Answer with no sources"
        assert data["sources"] == []
        assert data["metadata"]["sources"] == 0


@pytest.mark.unit
def test_query_language_normalization_spanish(client: TestClient):
    """Test language normalization for Spanish."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        mock_response.response = "Respuesta en español"
        mock_response.source_nodes = []
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        for lang_variant in ["es", "ES", "esp", "spanish", None]:
            payload = {"query": "test", "language": lang_variant}
            response = client.post("/query", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["metadata"]["language"] == "es"


@pytest.mark.unit
def test_query_language_normalization_english(client: TestClient):
    """Test language normalization for English."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        mock_response.response = "Answer in English"
        mock_response.source_nodes = []
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        for lang_variant in ["en", "EN", "english"]:
            payload = {"query": "test", "language": lang_variant}
            response = client.post("/query", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["metadata"]["language"] == "en"


@pytest.mark.unit
def test_query_top_k_parameter(client: TestClient):
    """Test that top_k parameter is passed to query engine."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        mock_response.response = "Test answer"
        mock_response.source_nodes = []
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        payload = {"query": "test question", "top_k": 10}
        response = client.post("/query", json=payload)

        assert response.status_code == 200
        # Verify get_query_engine was called with top_k=10
        mock_engine.assert_called_once_with(10, "es")


@pytest.mark.unit
def test_query_handles_llm_response_without_response_attribute(client: TestClient):
    """Test fallback when LLM response lacks 'response' attribute."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        # Remove 'response' attribute to simulate different LLM response format
        del mock_response.response
        mock_response.message = "Fallback message"
        mock_response.source_nodes = []
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        payload = {"query": "test"}
        response = client.post("/query", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "Fallback message"


@pytest.mark.unit
def test_query_handles_llm_response_with_str_conversion(client: TestClient):
    """Test that response is converted to string."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        del mock_response.response
        del mock_response.message
        mock_response.__str__ = lambda self: "String representation"
        mock_response.source_nodes = []
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        payload = {"query": "test"}
        response = client.post("/query", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["answer"], str)


@pytest.mark.unit
def test_query_handles_engine_exception(client: TestClient):
    """Test error handling when query engine fails."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_engine.side_effect = Exception("Ollama connection failed")

        payload = {"query": "test"}
        response = client.post("/query", json=payload)

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data


@pytest.mark.unit
def test_query_source_text_truncation(client: TestClient):
    """Test that source text is truncated to 200 characters."""
    with patch("routes.query.get_query_engine") as mock_engine:
        long_text = "A" * 500  # 500 characters
        mock_response = MagicMock()
        mock_response.response = "Test answer"
        mock_response.source_nodes = [MagicMock(node=MagicMock(text=long_text, metadata={}), score=0.9)]
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        payload = {"query": "test"}
        response = client.post("/query", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data["sources"][0]["text"]) == 200


@pytest.mark.unit
def test_query_includes_model_metadata(client: TestClient):
    """Test that response includes model metadata."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        mock_response.response = "Test"
        mock_response.source_nodes = []
        mock_response.metadata = {}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        payload = {"query": "test"}
        response = client.post("/query", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "model" in data["metadata"]


@pytest.mark.unit
def test_query_consolidates_llm_metadata(client: TestClient):
    """Test that LLM metadata is merged into response metadata."""
    with patch("routes.query.get_query_engine") as mock_engine:
        mock_response = MagicMock()
        mock_response.response = "Test"
        mock_response.source_nodes = []
        mock_response.metadata = {"custom_key": "custom_value", "tokens": 150}

        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = mock_response
        mock_engine.return_value = mock_query_engine

        payload = {"query": "test"}
        response = client.post("/query", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["metadata"]["custom_key"] == "custom_value"
        assert data["metadata"]["tokens"] == 150
