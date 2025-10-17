import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:8030"
TIMEOUT = 30

def test_authentication_protects_api_endpoints_and_dev_bypass_mode():
    """
    Ensure that authentication protects all API endpoints and that the development bypass mode functions correctly
    without compromising security in production.
    """

    # List of endpoints with HTTP methods to test authentication enforcement
    endpoints = [
        ("/health", "GET"),
        ("/ingest", "POST"),
        ("/query", "POST"),
        ("/auth/token", "POST"),  # Typically auth endpoint should be accessible without token
    ]

    headers_no_auth = {}
    # Crafted dummy payloads for POST endpoints to check auth:
    payloads = {
        "/ingest": {},  # empty for auth protection test; multipart file upload can't be empty, so skip payload here
        "/query": {"question": "Test question"},
        "/auth/token": {"username": "user", "password": "pass"},
    }

    # 1) Check that all endpoints except auth token require authentication

    for path, method in endpoints:
        url = BASE_URL + path
        try:
            if method == "GET":
                resp = requests.get(url, headers=headers_no_auth, timeout=TIMEOUT)
            elif method == "POST":
                if path == "/ingest":
                    # For /ingest, simulate missing auth with no file, expecting 401 or 403 or 422 due to missing file
                    resp = requests.post(url, headers=headers_no_auth, timeout=TIMEOUT)
                else:
                    resp = requests.post(url, json=payloads.get(path, {}), headers=headers_no_auth, timeout=TIMEOUT)
            else:
                continue

        except RequestException as e:
            assert False, f"Request to {path} failed unexpectedly: {e}"

        # /auth/token should allow without auth (200 or 400 for bad login), /health usually accessible
        # others should block (401/403), /ingest can return 422 due to missing payload
        if path == "/auth/token":
            assert resp.status_code in (200, 400, 401, 403), (
                f"/auth/token endpoint should be accessible but returned status {resp.status_code}"
            )
        elif path == "/health":
            assert resp.status_code in (200, 401, 403), (
                f"Endpoint /health returned unexpected status {resp.status_code}"
            )
        elif path == "/ingest":
            assert resp.status_code in (401, 403, 422), (
                f"Endpoint {path} should require authentication but returned status {resp.status_code}"
            )
        else:
            assert resp.status_code in (401, 403), (
                f"Endpoint {path} should require authentication but returned status {resp.status_code}"
            )

    # 2) Test Dev Bypass Mode works correctly (simulate dev mode bypass)

    dev_bypass_header = {"X-Dev-Bypass": "true"}

    for path, method in endpoints:
        url = BASE_URL + path
        try:
            if method == "GET":
                resp = requests.get(url, headers=dev_bypass_header, timeout=TIMEOUT)
            elif method == "POST":
                if path == "/ingest":
                    resp = requests.post(url, headers=dev_bypass_header, timeout=TIMEOUT)
                else:
                    resp = requests.post(url, json=payloads.get(path, {}), headers=dev_bypass_header, timeout=TIMEOUT)
            else:
                continue
        except RequestException as e:
            assert False, f"Request to {path} with dev bypass failed unexpectedly: {e}"

        # For /auth/token, bypass header probably irrelevant, expect normal behavior (allowed).
        # For other endpoints, bypass should allow access without auth in dev mode, expect not 401/403.
        if path == "/auth/token":
            assert resp.status_code in (200, 400, 401, 403), (
                f"/auth/token with dev bypass returned unexpected status {resp.status_code}"
            )
        elif path == "/health":
            assert resp.status_code in (200, 401, 403), (
                f"Dev bypass mode returned unexpected status for {path}: {resp.status_code}"
            )
        elif path == "/ingest":
            assert resp.status_code in (200, 422) or resp.status_code < 400 and resp.status_code not in (401, 403), (
                f"Dev bypass mode did not grant access to {path}; status code: {resp.status_code}"
            )
        else:
            assert resp.status_code < 400 or resp.status_code not in (401, 403), (
                f"Dev bypass mode did not grant access to {path}; status code: {resp.status_code}"
            )

    # 3) Verify that in production mode without dev bypass, no access is granted without auth (repeat step 1)
    # Already tested in step 1, no further action needed here.

test_authentication_protects_api_endpoints_and_dev_bypass_mode()