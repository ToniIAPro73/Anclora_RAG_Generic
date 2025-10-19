import requests

payload = {
    "query": "¿Qué documentos tienes?",
    "language": "es",
    "top_k": 3
}

response = requests.post("http://localhost:8001/query", json=payload)
print(response.status_code)
print(response.text)
