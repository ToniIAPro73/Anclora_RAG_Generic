import requests
import time

BASE_URL = "http://localhost:8030"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_document_query_returns_ai_generated_answers_with_citations():
    # Step 1: Ingest a sample document to index content for query testing
    ingest_url = f"{BASE_URL}/ingest"
    sample_text = (
        "Anclora RAG Generic is a powerful Retrieval-Augmented Generation system that "
        "centralizes knowledge and provides AI-generated answers with source citations."
    )
    # Prepare a simple text file content as bytes
    files = {
        "file": ("sample.txt", sample_text.encode("utf-8"), "text/plain")
    }

    # Upload the document
    ingest_response = requests.post(ingest_url, files=files, timeout=TIMEOUT)
    assert ingest_response.status_code == 200, f"Ingest failed: {ingest_response.text}"
    ingest_json = ingest_response.json()
    chunk_count = ingest_json.get("chunk_count") or ingest_json.get("chunks_ingested")
    assert isinstance(chunk_count, int) and chunk_count > 0, "Invalid chunk count in ingest response"

    try:
        # Short delay to allow indexing
        time.sleep(2)

        # Step 2: Query the system to get an AI-generated answer with source citations
        query_url = f"{BASE_URL}/query"
        query_payload = {
            "question": "What is Anclora RAG Generic and what features does it provide?"
        }
        query_response = requests.post(query_url, json=query_payload, headers=HEADERS, timeout=TIMEOUT)
        assert query_response.status_code == 200, f"Query failed: {query_response.text}"
        query_json = query_response.json()

        # Validate expected fields in response
        assert "answer" in query_json, "No 'answer' field in query response"
        answer_text = query_json["answer"]
        assert isinstance(answer_text, str) and len(answer_text) > 0, "Answer text is empty or invalid"

        # Validate source citations presence
        assert "sources" in query_json or "citations" in query_json, "No 'sources' or 'citations' in query response"
        sources = query_json.get("sources") or query_json.get("citations")
        assert isinstance(sources, list) and len(sources) > 0, "Sources/citations is empty or invalid type"

        # Check that at least one source contains identifiable metadata
        valid_source_found = any(
            isinstance(s, dict) and 
            (("title" in s and s["title"]) or ("source" in s and s["source"]))
            for s in sources
        )
        assert valid_source_found, "No valid source metadata found in sources/citations"

        # Optionally check that answer is related to original document content
        assert "Retrieval-Augmented Generation" in answer_text or "Anclora" in answer_text, \
            "Answer does not appear related to indexed document content"

    finally:
        # Cleanup: delete the ingested documents if an endpoint supported this, 
        # but since not specified, skipping removal.
        pass


test_document_query_returns_ai_generated_answers_with_citations()
