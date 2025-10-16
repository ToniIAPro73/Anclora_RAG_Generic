import requests

BASE_URL = "http://localhost:8030"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_rag_query_endpoint_returns_ai_generated_answers_with_sources():
    # Prepare two queries, one in English and one in Spanish
    queries = [
        {"query": "What is Anclora RAG Generic?"},     # English query
        {"query": "¿Qué es Anclora RAG Generic?"}      # Spanish query
    ]
    
    for q in queries:
        try:
            response = requests.post(
                f"{BASE_URL}/query",
                headers=HEADERS,
                json=q,
                timeout=TIMEOUT
            )
        except requests.RequestException as e:
            raise AssertionError(f"Request to /query failed: {e}")
        
        # Validate response HTTP status
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        
        try:
            data = response.json()
        except ValueError:
            raise AssertionError("Response is not valid JSON")
        
        # Assert response has AI-generated answer and sources
        assert "answer" in data, "Response JSON missing 'answer' field"
        assert isinstance(data["answer"], str), "'answer' field is not a string"
        assert len(data["answer"].strip()) > 0, "'answer' field is empty"
        
        # Sources must be present and non-empty list
        assert "sources" in data, "Response JSON missing 'sources' field"
        assert isinstance(data["sources"], list), "'sources' field is not a list"
        assert len(data["sources"]) > 0, "'sources' list is empty"
        
        # Each source should have some identifying information (e.g. doc_name or id)
        for source in data["sources"]:
            assert isinstance(source, dict), "Each source is not a dict"
            # We allow any keys but expect at least one key to identify source
            assert len(source) > 0, "Source dictionary is empty"

# Call the test function
test_rag_query_endpoint_returns_ai_generated_answers_with_sources()
