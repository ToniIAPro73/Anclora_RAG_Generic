import logging
import tempfile
from pathlib import Path
from typing import Final

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from deps import require_admin
from workers.ingestion_worker import process_single_document

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ingest"])

ALLOWED_EXTENSIONS: Final[set[str]] = {".pdf", ".docx", ".txt", ".md", ".markdown"}


def _validate_filename(filename: str | None) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename in upload")

    extension = Path(filename).suffix.lower()
    if extension and extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{extension}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    return filename


@router.post("/ingest")
async def ingest_document(
    file: UploadFile = File(...),
    _: None = Depends(require_admin),
):
    """Ingesta síncrona de documentos para asegurar retroalimentación inmediata durante el testing."""
    filename = _validate_filename(file.filename)
    payload = await file.read()
    file_size_kb = len(payload) / 1024

    logger.info(f"Starting document ingestion: {filename} ({round(file_size_kb, 2)}KB)")

    if not payload:
        logger.warning(f"Empty file upload attempted: {filename}")
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    tmp_suffix = Path(filename).suffix or ".tmp"
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=tmp_suffix) as temp_file:
            temp_file.write(payload)
            temp_path = Path(temp_file.name)

        logger.debug(f"Processing document: {filename} (temp: {temp_path})")

        result = process_single_document(
            file_path=str(temp_path),
            filename=filename,
            content_type=file.content_type or "application/octet-stream",
        )

        logger.info(
            f"Document ingestion completed: {filename} - {result['chunks']} chunks - {result.get('status', 'completed')}"
        )

    except ValueError as exc:
        logger.warning(f"Validation error during ingestion: {filename} - {str(exc)}")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        logger.error(f"Temporary file missing: {filename} - {str(exc)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Temporary file handling failed") from exc
    except Exception as exc:  # pragma: no cover - defend against unexpected worker issues
        logger.error(f"Unexpected error during ingestion: {filename} - {str(exc)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to ingest document") from exc
    finally:
        if "temp_path" in locals() and temp_path.exists():
            try:
                temp_path.unlink()
                logger.debug(f"Temporary file cleaned up: {temp_path}")
            except Exception as cleanup_exc:
                logger.debug(f"Temporary file already handled: {temp_path} - {str(cleanup_exc)}")

    return {
        "file": result["filename"],
        "chunks": result["chunks"],
        "chunk_count": result["chunks"],  # Alias for compatibility with tests
        "status": result.get("status", "completed"),
    }
