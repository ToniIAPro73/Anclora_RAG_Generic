"""Helper functions used by the ingestion RQ worker (and synchronous fallbacks)."""

from __future__ import annotations

import json
import logging
import uuid
from pathlib import Path
from typing import Callable, Dict

from packages.parsers.docx_parser import parse_docx_bytes
from packages.parsers.markdown import parse_markdown_bytes
from packages.parsers.pdf import parse_pdf_bytes
from packages.parsers.text import parse_text_bytes
from rag.pipeline import index_text
from rq import get_current_job

logger = logging.getLogger(__name__)


Parser = Callable[[bytes], str]

CONTENT_TYPE_PARSERS: Dict[str, Parser] = {
    "application/pdf": parse_pdf_bytes,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parse_docx_bytes,
    "text/markdown": parse_markdown_bytes,
    "text/plain": parse_text_bytes,
    "application/octet-stream": parse_markdown_bytes,
}

EXTENSION_PARSERS: Dict[str, Parser] = {
    ".pdf": parse_pdf_bytes,
    ".docx": parse_docx_bytes,
    ".md": parse_markdown_bytes,
    ".markdown": parse_markdown_bytes,
    ".txt": parse_text_bytes,
}


def _resolve_parser(filename: str, content_type: str) -> Parser:
    parser = CONTENT_TYPE_PARSERS.get(content_type)
    if parser:
        return parser

    extension = Path(filename).suffix.lower()
    parser = EXTENSION_PARSERS.get(extension)
    if parser:
        logger.debug("Resolved parser for %s using extension %s", filename, extension)
        return parser

    raise ValueError(f"Unsupported content type '{content_type}' for file '{filename}'")


def _notify_job_progress(job_id: str, status: str, data: Dict = None):
    """
    Publish job progress to Redis pub/sub for WebSocket notifications.

    This allows the worker (running in a separate process) to notify
    connected WebSocket clients about job status changes.
    """
    try:
        from clients.redis_queue import get_redis_connection

        redis_conn = get_redis_connection()
        message = {
            "job_id": job_id,
            "status": status,
            "type": "job_update",
            **(data or {})
        }
        redis_conn.publish(f"job:{job_id}", json.dumps(message))
        logger.debug(f"Published job update for {job_id}: {status}")
    except Exception as exc:
        # Don't fail the job if notification fails
        logger.warning(f"Failed to publish job notification for {job_id}: {str(exc)}")


def process_single_document(file_path: str, filename: str, content_type: str) -> Dict[str, object]:
    """Parse and index a single document, returning a summary payload."""
    # Get current job ID for notifications
    job = get_current_job()
    job_id = job.id if job else None

    try:
        # Notify: Starting processing
        if job_id:
            _notify_job_progress(job_id, "processing", {"filename": filename})

        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Temporary file not found: {file_path}")

        parser = _resolve_parser(filename, content_type)

        payload = path.read_bytes()
        if not payload:
            raise ValueError("Empty file uploaded")

        # Notify: Parsing document
        if job_id:
            _notify_job_progress(job_id, "processing", {
                "filename": filename,
                "step": "parsing"
            })

        text = parser(payload)
        if not text.strip():
            raise ValueError("Parsed document is empty")

        document_id = f"{Path(filename).stem}-{uuid.uuid4().hex}"
        logger.info("Indexing document %s", document_id)

        # Notify: Indexing
        if job_id:
            _notify_job_progress(job_id, "processing", {
                "filename": filename,
                "step": "indexing"
            })

        chunk_count = index_text(document_id, text)

        try:
            path.unlink()
        except Exception as exc:  # pragma: no cover - best effort cleanup
            logger.warning("Failed to remove temporary file %s: %s", file_path, exc)

        result = {"filename": filename, "chunks": chunk_count, "status": "completed"}

        # Notify: Completed
        if job_id:
            _notify_job_progress(job_id, "completed", {
                "filename": filename,
                "chunks": chunk_count
            })

        logger.info("Completed ingestion for %s with %s chunks", filename, chunk_count)
        return result

    except Exception as exc:
        # Notify: Failed
        if job_id:
            _notify_job_progress(job_id, "failed", {
                "filename": filename,
                "error": str(exc)
            })
        raise


def process_document_task(*_args, **_kwargs) -> None:
    """Placeholder for batch ingestion tasks."""
    # TODO: Integrate with batch ingestion pipeline once available.
    pass
