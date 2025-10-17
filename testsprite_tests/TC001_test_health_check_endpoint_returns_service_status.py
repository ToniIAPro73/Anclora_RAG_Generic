import requests

def test_health_check_endpoint_returns_service_status():
    base_url = "http://localhost:8030"
    endpoint = f"{base_url}/health"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(endpoint, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"HTTP request to /health endpoint failed: {e}"

    assert response.headers.get("Content-Type", "").startswith("application/json"), "Response is not JSON"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response body is not valid JSON"

    # Verify that service status and version keys exist and have valid types
    assert "status" in data, "'status' key not found in response"
    assert isinstance(data["status"], str), "'status' should be a string"

    assert "version" in data, "'version' key not found in response"
    assert isinstance(data["version"], str), "'version' should be a string"

    # Additional sanity checks (e.g., status is one of expected values)
    expected_status_values = {"ok", "running", "healthy", "up"}
    assert data["status"].lower() in expected_status_values, f"Unexpected status value: {data['status']}"

test_health_check_endpoint_returns_service_status()