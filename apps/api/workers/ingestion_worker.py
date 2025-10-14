@'
"""
Worker RQ para procesamiento de documentos.
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from packages.parsers.pdf import parse_pdf_bytes
from packages.parsers.docx_parser import parse_docx_bytes
from packages.parsers.markdown import parse_markdown_bytes
from packages.parsers.text import parse_text_bytes

# Import from apps.api (adjusting path since we're in apps/api/workers)
sys.path.insert(0, str(Path(__file__).parent.parent))
from rag.pipeline import index_text

CT = {
    "application/pdf": parse_pdf_bytes,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parse_docx_bytes,
    "text/markdown": parse_markdown_bytes,
    "text/plain": parse_text_bytes,
    "application/octet-stream": parse_markdown_bytes,
}

def process_single_document(file_path: str, filename: str, content_type: str):
    """
    Procesa un documento individual: parseo + indexación.
    """
    print(f"🔄 Procesando: {filename}")
    
    # 1. Parsear
    parser = CT.get(content_type)
    if not parser:
        raise ValueError(f"Unsupported content type: {content_type}")
    
    with open(file_path, "rb") as f:
        content = f.read()
    
    text = parser(content)
    
    if not text.strip():
        raise ValueError("Empty document after parsing")
    
    # 2. Indexar
    chunks = index_text(text, {"filename": filename, "source": "upload"})
    
    # 3. Limpiar archivo temporal
    try:
        os.remove(file_path)
    except Exception as e:
        print(f"⚠️ No se pudo eliminar archivo temporal: {e}")
    
    print(f"✅ Completado: {filename} ({chunks} chunks)")
    return {"filename": filename, "chunks": chunks, "status": "completed"}


def process_document_task(doc_id: str, batch_id: str, file_path: str, collection_name: str):
    """
    Task para procesamiento de documento en batch (implementación futura completa).
    """
    # TODO: Implementar lógica completa con BatchManager
    pass
'@ | Set-Content workers/ingestion_worker.py -Encoding UTF8