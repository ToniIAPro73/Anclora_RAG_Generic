import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:8030"
TIMEOUT = 30

def test_authentication_protects_api_endpoints_and_dev_bypass_mode():
    """
    Ensure all API endpoints require authentication and the dev bypass mode works without compromising production security.
    We will test endpoints:
    - /health (GET)
    - /ingest (POST)
    - /query (POST)
    
    We test:
    1. Requests without auth fail with 401 or 403 for protected endpoints (/ingest, /query).
    2. Requests with invalid auth fail for protected endpoints.
    3. Dev bypass mode header allows access only in dev.
    """

    endpoints = [
        {"method": "GET", "url": f"{BASE_URL}/health"},
        {"method": "POST", "url": f"{BASE_URL}/ingest"},
        {"method": "POST", "url": f"{BASE_URL}/query"},
    ]

    # Sample payloads for POST endpoints
    query_payload = {
        "question": "What is the company policy?"
    }

    # Minimal dummy file for /ingest testing
    dummy_file = {'file': ('dummy.txt', b'Test content')}

    dev_bypass_header = {"X-Dev-Bypass-Auth": "true"}
    invalid_token_header = {"Authorization": "Bearer invalidtoken123"}

    # 1. Test endpoints without any auth - expect 401 or 403 only for protected endpoints
    for ep in endpoints:
        if ep["url"].endswith("/health"):
            # Skip auth test for health endpoint as it may allow unauthenticated access
            continue
        try:
            if ep["method"] == "GET":
                resp = requests.get(ep["url"], timeout=TIMEOUT)
            elif ep["method"] == "POST":
                if ep["url"].endswith("/ingest"):
                    # Use dummy file instead of empty
                    resp = requests.post(ep["url"], files=dummy_file, timeout=TIMEOUT)
                else:
                    resp = requests.post(ep["url"], json=query_payload, timeout=TIMEOUT)
            else:
                continue

            assert resp.status_code in (401, 403), (
                f"Endpoint {ep['url']} without auth should be 401 or 403 but got {resp.status_code}"
            )
        except RequestException as e:
            assert False, f"Request to {ep['url']} without auth failed with exception: {e}"

    # 2. Test endpoints with invalid auth token - expect 401 or 403 only for protected endpoints
    for ep in endpoints:
        if ep["url"].endswith("/health"):
            # Skip invalid auth test for health endpoint
            continue
        headers = invalid_token_header
        try:
            if ep["method"] == "GET":
                resp = requests.get(ep["url"], headers=headers, timeout=TIMEOUT)
            elif ep["method"] == "POST":
                if ep["url"].endswith("/ingest"):
                    resp = requests.post(ep["url"], headers=headers, files=dummy_file, timeout=TIMEOUT)
                else:
                    resp = requests.post(ep["url"], headers=headers, json=query_payload, timeout=TIMEOUT)
            else:
                continue

            assert resp.status_code in (401, 403), (
                f"Endpoint {ep['url']} with invalid auth should be 401 or 403 but got {resp.status_code}"
            )
        except RequestException as e:
            assert False, f"Request to {ep['url']} with invalid auth failed: {e}"

    # 3. Test dev bypass mode header without standard auth
    # It should allow access in dev mode (status 200 or 202 typically);
    # we assume the dev bypass header "X-Dev-Bypass-Auth" controls this.
    for ep in endpoints:
        headers = dev_bypass_header
        try:
            if ep["method"] == "GET":
                resp = requests.get(ep["url"], headers=headers, timeout=TIMEOUT)
            elif ep["method"] == "POST":
                if ep["url"].endswith("/ingest"):
                    resp = requests.post(ep["url"], headers=headers, files=dummy_file, timeout=TIMEOUT)
                else:
                    resp = requests.post(ep["url"], headers=headers, json=query_payload, timeout=TIMEOUT)
            else:
                continue

            # In dev bypass mode, access should be allowed (e.g. 200-299)
            # but to ensure security, do not allow full access in production (would be environment specific)
            assert 200 <= resp.status_code < 300, (
                f"Endpoint {ep['url']} with dev bypass header expected 2xx but got {resp.status_code}"
            )
        except RequestException as e:
            assert False, f"Request to {ep['url']} with dev bypass header failed: {e}"


test_authentication_protects_api_endpoints_and_dev_bypass_mode()
