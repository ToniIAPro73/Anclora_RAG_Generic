import requests

BASE_URL = "http://localhost:8030"
TIMEOUT = 30

def test_health_check_endpoint_returns_operational_status():
    url = f"{BASE_URL}/health"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request to /health endpoint failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response from /health endpoint is not valid JSON"

    # Validate presence of expected service metadata keys indicating operational status
    expected_keys = ["status", "service", "version"]

    # At least 'status' should be included and be 'operational' or similar
    assert "status" in data, "Response JSON does not contain 'status' key"
    assert data["status"].lower() in ["operational", "ok", "healthy", "healthy"], f"Unexpected status value: {data['status']}"

    # Optionally check for service name and version if present
    if "service" in data:
        assert isinstance(data["service"], str) and data["service"], "Service name should be a non-empty string"
    if "version" in data:
        assert isinstance(data["version"], str) and data["version"], "Version should be a non-empty string"

test_health_check_endpoint_returns_operational_status()