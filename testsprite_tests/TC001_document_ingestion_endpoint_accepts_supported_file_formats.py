import requests
import io

BASE_URL = "http://localhost:8030"
TIMEOUT = 30


def test_document_ingestion_endpoint_accepts_supported_file_formats():
    endpoint = f"{BASE_URL}/ingest"
    headers = {
        # Auth bypass for local development is enabled, so no auth headers required
    }

    # Sample minimal content per file format for testing ingestion
    files_data = {
        "sample.pdf": b"%PDF-1.4\n%EOF\n1 0 obj\n<< /Type /Catalog >>\nendobj\n",
        "sample.docx": (
            b"PK\x03\x04\x14\x00\x06\x00"
            b"word/document.xml"
            b"<?xml version='1.0' encoding='UTF-8' standalone='yes'?>"
            b"<w:document xmlns:w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'>"
            b"<w:body><w:p><w:r><w:t>Test DOCX content.</w:t></w:r></w:p></w:body></w:document>"
        ),
        "sample.txt": b"Sample plain text content for ingestion testing.",
        "sample.md": b"# Sample Markdown\n\nThis is a test markdown document.",
    }

    for filename, content in files_data.items():
        file_type = None
        if filename.endswith(".pdf"):
            file_type = "application/pdf"
        elif filename.endswith(".docx"):
            file_type = (
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        elif filename.endswith(".txt"):
            file_type = "text/plain"
        elif filename.endswith(".md"):
            file_type = "text/markdown"
        else:
            continue  # Skip unsupported

        # Use BytesIO to simulate file upload
        file_to_upload = ('file', (filename, io.BytesIO(content), file_type))

        try:
            response = requests.post(
                endpoint,
                files=[file_to_upload],
                headers=headers,
                timeout=TIMEOUT,
            )
        except requests.RequestException as e:
            assert False, f"HTTP request failed for {filename}: {e}"

        # Expect 200 OK for success ingestion
        assert (
            response.status_code == 200
        ), f"Ingestion failed for {filename} with status code {response.status_code}"

        try:
            json_resp = response.json()
        except ValueError:
            assert False, f"Response is not JSON for {filename}: {response.text}"

        # Validate json response has chunk counts and related data
        assert (
            "chunks" in json_resp or "chunk_count" in json_resp
        ), f"Missing chunk statistics in response for {filename}"

        chunks = json_resp.get("chunks") or json_resp.get("chunk_count")
        assert isinstance(
            chunks, (list, int)
        ), f"Chunk count/chunks should be list or int for {filename}"

        # If chunks is a list, it should not be empty; if int, it should be > 0
        if isinstance(chunks, list):
            assert (
                len(chunks) > 0
            ), f"Chunk list is empty indicating no chunks processed for {filename}"
        elif isinstance(chunks, int):
            assert (
                chunks > 0
            ), f"Chunk count is zero indicating no chunks processed for {filename}"



test_document_ingestion_endpoint_accepts_supported_file_formats()