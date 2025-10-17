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
        data = response.json()

        # Assert the presence of essential keys in response JSON
        assert isinstance(data, dict), "Response is not a JSON object"
        assert "status" in data, "Response JSON missing 'status' key"
        assert "version" in data, "Response JSON missing 'version' key"

        # Assert the status field indicates service is healthy (assuming 'ok' means healthy)
        assert data["status"].lower() in ["ok", "healthy", "up", "running"], f"Unexpected service status: {data['status']}"
        # Assert version is a non-empty string
        assert isinstance(data["version"], str) and data["version"].strip() != "", "Version is empty or not a string"
    except requests.exceptions.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_health_check_endpoint_returns_service_status()