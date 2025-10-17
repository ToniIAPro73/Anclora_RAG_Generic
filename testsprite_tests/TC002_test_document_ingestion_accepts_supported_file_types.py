import requests
import io

BASE_URL = "http://localhost:8030"
TIMEOUT = 30
INGEST_ENDPOINT = f"{BASE_URL}/ingest"
HEADERS = {
    # Assuming dev mode auth bypass or no auth is needed based on PRD.
    # If auth needed, add Authorization header here.
}

def test_document_ingestion_accepts_supported_file_types():
    supported_files = {
        "sample.pdf": b"%PDF-1.4\n%EOF\n",  # minimal valid PDF header/footer
        "sample.docx": (
            b"PK\x03\x04"  # DOCX is a zip, minimal signature
            b"\x14\x00\x06\x00"
            b"\x00\x00\x00\x00\x00\x00\x00\x00"
        ),
        "sample.txt": b"Hello, this is a plain text file for testing ingestion.",
        "sample.md": b"# Markdown Title\n\nThis is a sample markdown file."
    }
    
    created_doc_ids = []

    try:
        for filename, filecontent in supported_files.items():
            files = {
                "file": (filename, io.BytesIO(filecontent), "application/octet-stream")
            }
            response = requests.post(
                INGEST_ENDPOINT,
                headers=HEADERS,
                files=files,
                timeout=TIMEOUT
            )
            assert response.status_code == 200, f"Failed on {filename} with status {response.status_code}"
            resp_json = response.json()
            assert isinstance(resp_json, dict), f"Response not JSON object for {filename}"
            
            chunk_count = resp_json.get("chunk_count")
            if chunk_count is None:
                chunk_count = resp_json.get("chunks")
            assert chunk_count is not None, f"chunk_count not in response for {filename}"
            assert isinstance(chunk_count, int), f"chunk_count not int for {filename}"
            assert chunk_count > 0, f"chunk_count should be > 0 for {filename}"

            doc_id = resp_json.get("document_id") or resp_json.get("id")
            if doc_id:
                created_doc_ids.append(doc_id)

    finally:
        for doc_id in created_doc_ids:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/documents/{doc_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
                assert del_resp.status_code in (200, 204, 404), f"Failed to delete document {doc_id}"
            except Exception:
                pass


test_document_ingestion_accepts_supported_file_types()
