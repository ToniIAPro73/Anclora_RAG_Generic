import requests
import time

BASE_URL = "http://localhost:8030"
AUTH_TOKEN = "Bearer YOUR_AUTH_TOKEN_HERE"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": AUTH_TOKEN
}
TIMEOUT = 30

def test_document_query_returns_ai_generated_answers_with_citations():
    ingest_url = f"{BASE_URL}/ingest"
    query_url = f"{BASE_URL}/query"

    # Sample document content to ingest
    sample_text = (
        "Python is a versatile programming language. "
        "It supports multiple programming paradigms, such as procedural, object-oriented, and functional programming."
    )

    # Create a simple text file for ingestion
    file_content = sample_text.encode("utf-8")
    files = {
        "files": ("sample.txt", file_content, "text/plain"),
    }

    try:
        ingest_response = requests.post(
            ingest_url,
            files=files,
            timeout=TIMEOUT,
            headers={"Authorization": AUTH_TOKEN},  # omit Content-Type for multipart
        )
        assert ingest_response.status_code == 200, f"Ingest failed: {ingest_response.text}"
        ingest_json = ingest_response.json()
        assert "chunk_count" in ingest_json, "chunk_count missing in ingest response"
        assert ingest_json["chunk_count"] > 0, "chunk_count is zero or negative"

        # Allow some time for indexing to complete if asynchronous
        time.sleep(2)

        query_payload = {
            "question": "What programming paradigms does Python support?"
        }
        query_response = requests.post(
            query_url,
            json=query_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert query_response.status_code == 200, f"Query failed: {query_response.text}"
        query_json = query_response.json()

        assert "answer" in query_json, "No 'answer' field in query response"
        answer = query_json["answer"]
        assert isinstance(answer, str) and len(answer.strip()) > 0, "Answer is empty or invalid"

        assert "sources" in query_json, "No 'sources' field in query response"
        sources = query_json["sources"]
        assert isinstance(sources, list) and len(sources) > 0, "Sources list is empty or invalid"

        assert "programming paradigms" in answer.lower() or "object-oriented" in answer.lower() or "functional" in answer.lower(), \
            "Answer does not contain expected content about programming paradigms"
        for source in sources:
            assert "title" in source or "document" in source or "source" in source, "Source missing expected metadata keys"

    finally:
        pass

test_document_query_returns_ai_generated_answers_with_citations()