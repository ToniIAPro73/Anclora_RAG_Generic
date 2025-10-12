from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import sys
import os

# Add the project root to Python path for absolute imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from rag.pipeline import index_text
from deps import require_admin
from packages.parsers.pdf import parse_pdf_bytes
from packages.parsers.docx_parser import parse_docx_bytes
from packages.parsers.markdown import parse_markdown_bytes
from packages.parsers.text import parse_text_bytes

router = APIRouter(tags=["ingest"])

CT = {
    "application/pdf": parse_pdf_bytes,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parse_docx_bytes,
    "text/markdown": parse_markdown_bytes,
    "text/plain": parse_text_bytes,
}

@router.post("/ingest")
async def ingest(
    file: UploadFile = File(...),
    _: None = Depends(require_admin),
):
    parser = CT.get(file.content_type)
    if not parser:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")
    raw = await file.read()
    text = parser(raw)
    if not text.strip():
        raise HTTPException(400, "Empty content after parsing")
    n = index_text(doc_id=file.filename, text=text)
    return {"file": file.filename, "chunks": n}

