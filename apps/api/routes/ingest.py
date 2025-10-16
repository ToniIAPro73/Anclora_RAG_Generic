from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import sys
import os
from pathlib import Path
import tempfile
from redis import Redis
from rq import Queue

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from deps import require_admin

router = APIRouter(tags=["ingest"])

# Content type to parser mapping
CT = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/markdown": "markdown",
    "text/plain": "text",
    "application/octet-stream": "markdown",
}

def get_redis_queue() -> Queue:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_conn = Redis.from_url(redis_url)
    return Queue("ingestion_queue", connection=redis_conn)

@router.post("/ingest")
async def ingest(
    file: UploadFile = File(...),
    _: None = Depends(require_admin),
):
    """Ingesta asíncrona de documento individual."""
    parser_type = CT.get(file.content_type)
    if not parser_type:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")
    
    # Guardar archivo temporalmente
    temp_dir = Path(tempfile.gettempdir()) / "anclora_ingestion"
    temp_dir.mkdir(exist_ok=True)
    
    file_path = temp_dir / file.filename
    content = await file.read()
    
    if not content:
        raise HTTPException(400, "Empty file")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Encolar procesamiento
    queue = get_redis_queue()
    from workers.ingestion_worker import process_single_document
    
    job = queue.enqueue(
        process_single_document,
        file_path=str(file_path),
        filename=file.filename,
        content_type=file.content_type,
        job_timeout='30m'
    )
    
    return {
        "message": f"Documento '{file.filename}' encolado para procesamiento",
        "job_id": job.id,
        "status": "queued"
    }
