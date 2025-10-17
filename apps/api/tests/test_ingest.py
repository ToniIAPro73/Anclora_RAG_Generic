"""Tests for the /ingest endpoint."""

import io
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
def test_ingest_pdf_success(client: TestClient, sample_pdf_bytes: bytes, mock_process_single_document):
    """Test successful PDF upload and ingestion."""
    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")}

    response = client.post("/ingest", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "file" in data
    assert "chunks" in data
    assert "status" in data
    assert data["file"] == "test.pdf"
    assert data["chunks"] == 5
    assert data["status"] == "completed"
    mock_process_single_document.assert_called_once()


@pytest.mark.unit
def test_ingest_txt_success(client: TestClient, sample_text_content: str, mock_process_single_document):
    """Test successful TXT file upload."""
    files = {"file": ("test.txt", io.BytesIO(sample_text_content.encode()), "text/plain")}

    response = client.post("/ingest", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["file"] == "test.txt"
    assert data["chunks"] == 5
    assert data["status"] == "completed"


@pytest.mark.unit
def test_ingest_markdown_success(client: TestClient, sample_text_content: str, mock_process_single_document):
    """Test successful Markdown file upload."""
    files = {"file": ("test.md", io.BytesIO(sample_text_content.encode()), "text/markdown")}

    response = client.post("/ingest", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["file"] == "test.md"


@pytest.mark.unit
def test_ingest_unsupported_extension(client: TestClient):
    """Test rejection of unsupported file extensions."""
    content = b"fake executable content"
    files = {"file": ("malicious.exe", io.BytesIO(content), "application/x-msdownload")}

    response = client.post("/ingest", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Unsupported file extension" in data["detail"]
    assert ".exe" in data["detail"]


@pytest.mark.unit
def test_ingest_empty_file(client: TestClient):
    """Test rejection of empty files."""
    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}

    response = client.post("/ingest", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "empty" in data["detail"].lower()


@pytest.mark.unit
def test_ingest_missing_filename(client: TestClient):
    """Test rejection of uploads without filename."""
    files = {"file": (None, io.BytesIO(b"content"), "text/plain")}

    response = client.post("/ingest", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "filename" in data["detail"].lower()


@pytest.mark.unit
def test_ingest_validates_allowed_extensions(client: TestClient, sample_text_content: str):
    """Test that only allowed extensions are accepted."""
    allowed_extensions = [".pdf", ".docx", ".txt", ".md", ".markdown"]

    for ext in allowed_extensions:
        files = {"file": (f"test{ext}", io.BytesIO(sample_text_content.encode()), "text/plain")}
        with patch("workers.ingestion_worker.process_single_document") as mock:
            mock.return_value = {"filename": f"test{ext}", "chunks": 1, "status": "completed"}
            response = client.post("/ingest", files=files)
            # Should not return 400 for allowed extensions
            assert response.status_code != 400 or "Unsupported file extension" not in response.json().get(
                "detail", ""
            )


@pytest.mark.unit
def test_ingest_handles_worker_error(client: TestClient, sample_pdf_bytes: bytes):
    """Test proper error handling when worker fails."""
    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")}

    with patch("workers.ingestion_worker.process_single_document") as mock:
        mock.side_effect = ValueError("Failed to parse document")
        response = client.post("/ingest", files=files)

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


@pytest.mark.unit
def test_ingest_handles_file_not_found_error(client: TestClient, sample_pdf_bytes: bytes):
    """Test handling of FileNotFoundError from worker."""
    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")}

    with patch("workers.ingestion_worker.process_single_document") as mock:
        mock.side_effect = FileNotFoundError("Temporary file missing")
        response = client.post("/ingest", files=files)

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "Temporary file handling failed" in data["detail"]


@pytest.mark.unit
def test_ingest_handles_unexpected_error(client: TestClient, sample_pdf_bytes: bytes):
    """Test handling of unexpected errors from worker."""
    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")}

    with patch("workers.ingestion_worker.process_single_document") as mock:
        mock.side_effect = RuntimeError("Unexpected error")
        response = client.post("/ingest", files=files)

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "Failed to ingest document" in data["detail"]


@pytest.mark.unit
def test_ingest_normalizes_filename_with_accents(client: TestClient, sample_text_content: str):
    """Test that filenames with accents are handled correctly."""
    filename = "documento_con_acentos_ñ_á_é.txt"
    files = {"file": (filename, io.BytesIO(sample_text_content.encode()), "text/plain")}

    with patch("workers.ingestion_worker.process_single_document") as mock:
        mock.return_value = {"filename": filename, "chunks": 3, "status": "completed"}
        response = client.post("/ingest", files=files)

        assert response.status_code == 200
        data = response.json()
        assert data["file"] == filename
