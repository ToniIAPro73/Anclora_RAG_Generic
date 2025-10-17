import requests

def test_health_check_endpoint_returns_service_status():
    base_url = "http://localhost:8030"
    url = f"{base_url}/health"
    headers = {
        "AUTH_BYPASS": "false"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        # Validate expected keys in response
        assert "status" in data, "Response JSON missing 'status'"
        assert "version" in data, "Response JSON missing 'version'"
        # Validate status value is a string and is not empty
        assert isinstance(data["status"], str) and data["status"], "Invalid 'status' value"
        # Validate version value is a string and is not empty
        assert isinstance(data["version"], str) and data["version"], "Invalid 'version' value"
    except requests.RequestException as e:
        assert False, f"Request to /health endpoint failed: {e}"

test_health_check_endpoint_returns_service_status()