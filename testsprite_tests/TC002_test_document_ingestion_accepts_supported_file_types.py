import requests
import io

BASE_URL = "http://localhost:8030"
INGEST_ENDPOINT = f"{BASE_URL}/ingest"
TIMEOUT = 30

# Sample minimal content for each supported file type
file_contents = {
    "pdf": (
        "sample.pdf",
        b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n3 0 obj\n"
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Hello PDF) Tj ET\nendstream\n"
        b"endobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n"
        b"0000000178 00000 n \n0000000293 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n372\n%%EOF\n",
        "application/pdf",
    ),
    "docx": (
        "sample.docx",
        b"PK\x03\x04\x14\x00\x06\x00\x08\x00\x00\x00!\x00\xbb"
        b"\x8b\xceW\x00\x00\x00\x00\x00\x00\x00\x00\x13\x00\x13\x00"
        b"word/document.xml",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
    "txt": ("sample.txt", b"Hello, this is a plain text file for ingestion test.", "text/plain"),
    "md": ("sample.md", b"# Sample Markdown\nThis is a test markdown file.", "text/markdown"),
}


def test_document_ingestion_accepts_supported_file_types():
    headers = {}
    for suffix, (filename, file_bytes, content_type) in file_contents.items():
        files = {"file": (filename, io.BytesIO(file_bytes), content_type)}
        try:
            response = requests.post(INGEST_ENDPOINT, files=files, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed for .{suffix} file: {e}"

        assert response.status_code == 200, f"Failed ingestion for .{suffix} file: Status code {response.status_code}"
        try:
            json_response = response.json()
        except ValueError:
            assert False, f"Response is not valid JSON for .{suffix} file"

        chunk_count = None
        if "chunk_count" in json_response:
            chunk_count = json_response["chunk_count"]
        elif "chunks" in json_response:
            chunk_count = json_response["chunks"]
        elif "chunkCount" in json_response:
            chunk_count = json_response["chunkCount"]
        else:
            assert False, f"No chunk count info in response for .{suffix} file: {json_response}"

        assert isinstance(chunk_count, int), f"Chunk count is not an integer for .{suffix} file: {chunk_count}"
        assert chunk_count > 0, f"Chunk count should be greater than zero for .{suffix} file, got {chunk_count}"


test_document_ingestion_accepts_supported_file_types()
