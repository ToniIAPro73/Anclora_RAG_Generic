"""Pytest fixtures and configuration for API tests."""

import os
import sys
from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock, Mock, patch

import pytest
from fastapi.testclient import TestClient

# Add project paths to sys.path
current_dir = Path(__file__).parent.parent
project_root = current_dir.parent.parent
for path in [str(current_dir), str(project_root)]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Set test environment variables before importing app
os.environ["AUTH_BYPASS"] = "true"
os.environ["QDRANT_URL"] = "http://localhost:6333"
os.environ["OLLAMA_URL"] = "http://localhost:11434"
os.environ["OLLAMA_MODEL"] = "llama3.2:1b"


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app."""
    from main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_qdrant_client():
    """Mock Qdrant client for unit tests."""
    mock_client = MagicMock()
    mock_client.get_collections.return_value = MagicMock(collections=[])
    mock_client.create_collection.return_value = None
    mock_client.get_collection.return_value = MagicMock(points_count=5)
    return mock_client


@pytest.fixture
def mock_embed_model():
    """Mock embedding model for unit tests."""
    mock_model = MagicMock()
    mock_model.get_text_embedding_batch.return_value = [[0.1] * 768 for _ in range(5)]
    return mock_model


@pytest.fixture
def mock_llm():
    """Mock Ollama LLM for unit tests."""
    mock_llm = MagicMock()
    mock_response = MagicMock()
    mock_response.response = "This is a test answer from the LLM"
    mock_response.source_nodes = []
    mock_llm.query.return_value = mock_response
    return mock_llm


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    """Sample PDF file bytes for testing."""
    # Minimal valid PDF structure
    return b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >>
/MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000339 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
435
%%EOF
"""


@pytest.fixture
def sample_text_content() -> str:
    """Sample text content for testing."""
    return """This is a test document with some content.
It contains multiple lines and paragraphs.

This is useful for testing the RAG pipeline and query functionality.
"""


@pytest.fixture
def mock_process_single_document():
    """Mock the process_single_document worker function."""
    with patch("workers.ingestion_worker.process_single_document") as mock:
        mock.return_value = {
            "filename": "test.pdf",
            "chunks": 5,
            "status": "completed",
        }
        yield mock


@pytest.fixture
def mock_index_text():
    """Mock the RAG pipeline index_text function."""
    with patch("rag.pipeline.index_text") as mock:
        mock.return_value = 5  # Number of chunks
        yield mock
