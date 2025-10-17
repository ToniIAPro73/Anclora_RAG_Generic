import requests

BASE_URL = "http://localhost:8030"
TIMEOUT = 30

def test_authentication_protects_api_endpoints_and_dev_bypass_mode():
    """
    Ensure that authentication protects all API endpoints except /health, which allows unauthenticated access.
    Development bypass mode is assumed off (AUTH_BYPASS=false).
    We test main endpoints for authentication enforcement.
    """

    endpoints = [
        {"method": "GET", "url": f"{BASE_URL}/health"},
        {"method": "POST", "url": f"{BASE_URL}/ingest"},
        {"method": "POST", "url": f"{BASE_URL}/query"},
    ]

    # Test unauthenticated requests
    for ep in endpoints:
        method = ep["method"]
        url = ep["url"]
        if method == "GET":
            resp = requests.get(url, timeout=TIMEOUT)
            if url.endswith("/health"):
                # Health check is expected to allow unauthenticated access
                assert resp.status_code == 200, (
                    f"Health endpoint unauthenticated access failed with status {resp.status_code}"
                )
            else:
                assert resp.status_code in (401, 403), (
                    f"Endpoint {url} allowed unauthenticated access with status {resp.status_code}"
                )
        elif method == "POST":
            # For /ingest and /query, send empty or minimal payload with no auth
            if url.endswith("/ingest"):
                files = {}
                resp = requests.post(url, files=files, timeout=TIMEOUT)
                assert resp.status_code in (401, 403), (
                    f"Endpoint {url} allowed unauthenticated access with status {resp.status_code}"
                )
            elif url.endswith("/query"):
                json_payload = {"question": "Test query"}
                resp = requests.post(url, json=json_payload, timeout=TIMEOUT)
                assert resp.status_code in (401, 403), (
                    f"Endpoint {url} allowed unauthenticated access with status {resp.status_code}"
                )
            else:
                resp = requests.post(url, timeout=TIMEOUT)

    # Now test authenticated requests with fake token to confirm auth enforcement
    fake_headers = {"Authorization": "Bearer faketoken"}

    # Authenticated health check (GET /health) should still allow access
    resp_health = requests.get(f"{BASE_URL}/health", headers=fake_headers, timeout=TIMEOUT)
    assert resp_health.status_code == 200, (
        f"Health endpoint denied access with fake token: {resp_health.status_code}"
    )

    # Authenticated ingestion endpoint with fake token & minimal data
    files = {}
    resp_ingest = requests.post(f"{BASE_URL}/ingest", headers=fake_headers, files=files, timeout=TIMEOUT)
    assert resp_ingest.status_code in (401, 403), (
        f"Ingest endpoint allowed access with invalid token: {resp_ingest.status_code}"
    )

    # Authenticated query endpoint with fake token & sample question
    json_payload = {"question": "Is authentication enforced?"}
    resp_query = requests.post(f"{BASE_URL}/query", headers=fake_headers, json=json_payload, timeout=TIMEOUT)
    assert resp_query.status_code in (401, 403), (
        f"Query endpoint allowed access with invalid token: {resp_query.status_code}"
    )


test_authentication_protects_api_endpoints_and_dev_bypass_mode()