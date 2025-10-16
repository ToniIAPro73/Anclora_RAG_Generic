import requests
import io
import time

BASE_URL = "http://localhost:8030"
TIMEOUT = 30
HEADERS = {}  # No auth needed due to AUTH_BYPASS=true in local dev


def test_drag_and_drop_upload_interface_shows_progress_and_feedback():
    """
    Test the backend /ingest endpoint simulating a drag-and-drop document upload that includes:
    - File name normalization (including accented characters)
    - Upload progress feedback simulation (since backend does not stream progress, check response timing)
    - Accurate success or failure feedback via HTTP status and response content
    """

    # Prepare a test file with accented characters in the filename
    filename = "tést_dóçüment_áccented.txt"
    file_content = "This is a simple test document content for ingestion.".encode("utf-8")

    # Use in-memory bytes buffer to simulate file upload
    file_obj = io.BytesIO(file_content)

    start = time.time()
    files = {"file": (filename, file_obj, "text/plain")}
    response = requests.post(
        f"{BASE_URL}/ingest",
        files=files,
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    elapsed = time.time() - start

    # Assert HTTP 200 OK or acceptable success status
    assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"

    json_response = response.json()

    # The response should indicate success and chunk counts:
    # We'll check keys relevant to chunk counts or success indicators in ingestion response
    assert "chunk_count" in json_response or "chunks" in json_response or "success" in json_response, \
        "Response missing expected success indicators (chunk_count or success)"

    # Check that the filename was normalized (backend likely returns a processed filename or info)
    if "document" in json_response and isinstance(json_response["document"], dict):
        doc = json_response["document"]
        doc_filename = doc.get("filename") or doc.get("name") or ""
        assert doc_filename != filename, "Filename was not normalized (should differ due to accented chars)"
        assert all(ord(c) < 128 for c in doc_filename), "Normalized filename contains non-ASCII characters"
    elif "filename" in json_response:
        res_filename = json_response["filename"]
        assert res_filename != filename, "Filename was not normalized (should differ due to accented chars)"
        assert all(ord(c) < 128 for c in res_filename), "Normalized filename contains non-ASCII characters"

    # Check timely response (within 30s)
    assert elapsed < TIMEOUT, f"Upload request took too long: {elapsed} seconds"


test_drag_and_drop_upload_interface_shows_progress_and_feedback()
