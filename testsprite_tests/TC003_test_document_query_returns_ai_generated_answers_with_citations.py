import requests
import io

BASE_URL = "http://localhost:8030"
HEADERS = {
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_document_query_returns_ai_generated_answers_with_citations():
    # Step 1: Ingest a sample document to ensure there is indexed content to query
    ingest_url = f"{BASE_URL}/ingest"
    sample_text = "Anclora is a Retrieval-Augmented Generation system designed to centralize organizational knowledge."
    files = {
        "file": ("sample.txt", io.BytesIO(sample_text.encode('utf-8')), "text/plain")
    }

    # Ingest document
    ingest_response = requests.post(ingest_url, files=files, timeout=TIMEOUT)
    assert ingest_response.status_code == 200, f"Ingest failed with status {ingest_response.status_code}"
    ingest_result = ingest_response.json()
    assert "chunk_count" in ingest_result and ingest_result["chunk_count"] > 0, "No chunks ingested"

    try:
        # Step 2: Query the system with a question related to the ingested document
        query_url = f"{BASE_URL}/query"
        question = "What is Anclora designed to do?"
        payload = {
            "question": question
        }
        query_response = requests.post(query_url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        assert query_response.status_code == 200, f"Query failed with status {query_response.status_code}"
        query_result = query_response.json()

        # Validate AI-generated answer presence
        assert "answer" in query_result, "Response missing 'answer'"
        answer = query_result["answer"]
        assert isinstance(answer, str) and len(answer.strip()) > 0, "Answer is empty"

        # Validate citations presence and format
        assert "citations" in query_result, "Response missing 'citations'"
        citations = query_result["citations"]
        assert isinstance(citations, list) and len(citations) > 0, "Citations list empty or invalid"

        # Check that each citation has required fields
        for citation in citations:
            assert isinstance(citation, dict), "Each citation should be a dict"
            assert "source" in citation and isinstance(citation["source"], str) and len(citation["source"]) > 0, "Citation missing or invalid 'source'"
            assert "page" in citation or "chunk_id" in citation or "metadata" in citation, "Citation missing source identifier like page, chunk_id or metadata"

        # Optionally verify that the answer contains key info consistent with sample text
        assert "Retrieval-Augmented Generation" in answer or "centralize organizational knowledge" in answer, "Answer not consistent with indexed document content"

    finally:
        # Cleanup: Delete ingested document chunks if API supports it
        # Assuming the ingest response might include a document_id for deletion purpose
        doc_id = ingest_result.get("document_id")
        if doc_id:
            delete_url = f"{BASE_URL}/documents/{doc_id}"
            try:
                del_response = requests.delete(delete_url, timeout=TIMEOUT)
                assert del_response.status_code in (200, 204), f"Failed to delete document with ID {doc_id}"
            except Exception:
                pass


test_document_query_returns_ai_generated_answers_with_citations()
