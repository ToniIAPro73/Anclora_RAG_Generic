import requests
import os

BASE_URL = "http://localhost:8030"
TIMEOUT = 30
HEADERS = {"Auth-Bypass": "true"}

# Sample contents for each supported file type
FILE_CONTENTS = {
    "pdf": b"%PDF-1.4\n%Test PDF content",
    "docx": (
        b"PK\x03\x04\x14\x00\x06\x00"
        b"[content_types].xml"  # minimal docx binary signature and content
    ),
    "txt": b"Sample plain text content for ingestion test.",
    "md": b"# Sample Markdown\nThis is a test markdown file.\n"
}

# Mapping extension to filename
FILE_NAMES = {
    "pdf": "testfile.pdf",
    "docx": "testfile.docx",
    "txt": "testfile.txt",
    "md": "testfile.md"
}


def test_document_ingestion_accepts_supported_file_types():
    ingest_url = f"{BASE_URL}/ingest"
    for ext in ["pdf", "docx", "txt", "md"]:
        files = {
            "files": (FILE_NAMES[ext], FILE_CONTENTS[ext], _mime_type_for_extension(ext))
        }
        try:
            response = requests.post(
                ingest_url,
                headers=HEADERS,
                files=files,
                timeout=TIMEOUT,
            )
        except requests.RequestException as e:
            assert False, f"Request failed for {ext} file type: {e}"

        assert response.status_code == 200, (
            f"Expected 200 OK for {ext} file ingestion, got {response.status_code}. "
            f"Response text: {response.text}"
        )
        try:
            data = response.json()
        except Exception:
            assert False, f"Response is not valid JSON for {ext} file ingestion."

        # Validate response contains chunk counts (assuming schema includes 'chunk_count' integer)
        assert "chunk_count" in data, (
            f"'chunk_count' missing in response JSON for {ext} file ingestion."
        )
        chunk_count = data["chunk_count"]
        assert isinstance(chunk_count, int), (
            f"'chunk_count' should be int for {ext} file ingestion."
        )
        assert chunk_count > 0, (
            f"'chunk_count' should be positive for {ext} file ingestion."
        )


def _mime_type_for_extension(ext: str) -> str:
    if ext == "pdf":
        return "application/pdf"
    if ext == "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if ext == "txt":
        return "text/plain"
    if ext == "md":
        return "text/markdown"
    return "application/octet-stream"


test_document_ingestion_accepts_supported_file_types()
