import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, Final

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from rq.job import Job

from clients.redis_queue import get_ingestion_queue, get_redis_connection
from deps import require_admin
from workers.ingestion_worker import process_single_document

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ingest"])

# Feature flag for async ingestion
USE_ASYNC_INGESTION = os.getenv("USE_ASYNC_INGESTION", "true").lower() in {"1", "true", "yes"}

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
    """
    Ingest a document for processing.

    - Async mode (default): Enqueues job to RQ and returns job_id for tracking
    - Sync mode (USE_ASYNC_INGESTION=false): Processes immediately and returns result
    """
    filename = _validate_filename(file.filename)
    payload = await file.read()
    file_size_kb = len(payload) / 1024

    logger.info(f"Starting document ingestion: {filename} ({round(file_size_kb, 2)}KB) - Async: {USE_ASYNC_INGESTION}")

    if not payload:
        logger.warning(f"Empty file upload attempted: {filename}")
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    tmp_suffix = Path(filename).suffix or ".tmp"

    # Save file to temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=tmp_suffix) as temp_file:
        temp_file.write(payload)
        temp_path = Path(temp_file.name)

    content_type = file.content_type or "application/octet-stream"

    # ASYNC MODE: Enqueue job to RQ
    if USE_ASYNC_INGESTION:
        try:
            queue = get_ingestion_queue()
            job = queue.enqueue(
                process_single_document,
                file_path=str(temp_path),
                filename=filename,
                content_type=content_type,
                job_timeout=600,  # 10 minutes max
            )
            logger.info(f"Enqueued ingestion job {job.id} for {filename}")

            return {
                "job_id": job.id,
                "file": filename,
                "status": "queued",
                "message": f"Document queued for processing. Use job_id to check status."
            }
        except Exception as exc:
            # Cleanup temp file if enqueue fails
            if temp_path.exists():
                temp_path.unlink()
            logger.error(f"Failed to enqueue job for {filename}: {str(exc)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to enqueue document for processing") from exc

    # SYNC MODE: Process immediately
    try:
        logger.debug(f"Processing document synchronously: {filename} (temp: {temp_path})")

        result = process_single_document(
            file_path=str(temp_path),
            filename=filename,
            content_type=content_type,
        )

        logger.info(
            f"Document ingestion completed: {filename} - {result['chunks']} chunks - {result.get('status', 'completed')}"
        )

        return {
            "file": result["filename"],
            "chunks": result["chunks"],
            "chunk_count": result["chunks"],  # Alias for compatibility with tests
            "status": result.get("status", "completed"),
        }

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
        # Cleanup only in sync mode (async mode cleanup is handled by worker)
        if not USE_ASYNC_INGESTION and temp_path.exists():
            try:
                temp_path.unlink()
                logger.debug(f"Temporary file cleaned up: {temp_path}")
            except Exception as cleanup_exc:
                logger.debug(f"Temporary file already handled: {temp_path} - {str(cleanup_exc)}")


@router.get("/ingest/status/{job_id}")
async def get_ingestion_status(
    job_id: str,
    _: None = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Get the status of an async ingestion job.

    Returns job status, progress, and result/error information.
    Only available when USE_ASYNC_INGESTION=true.
    """
    if not USE_ASYNC_INGESTION:
        raise HTTPException(
            status_code=400,
            detail="Async ingestion is disabled. Enable USE_ASYNC_INGESTION to use job tracking."
        )

    try:
        conn = get_redis_connection()
        job = Job.fetch(job_id, connection=conn)

        # Map RQ job status to our response
        status_map = {
            "queued": "queued",
            "started": "processing",
            "finished": "completed",
            "failed": "failed",
            "deferred": "deferred",
            "scheduled": "scheduled",
            "stopped": "stopped",
            "canceled": "canceled",
        }

        response: Dict[str, Any] = {
            "job_id": job.id,
            "status": status_map.get(job.get_status(), job.get_status()),
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "ended_at": job.ended_at.isoformat() if job.ended_at else None,
        }

        # Add result if job completed successfully
        if job.is_finished and job.result:
            response["result"] = {
                "file": job.result.get("filename"),
                "chunks": job.result.get("chunks"),
                "status": job.result.get("status", "completed"),
            }

        # Add error details if job failed
        if job.is_failed:
            response["error"] = str(job.exc_info) if job.exc_info else "Unknown error"

        logger.debug(f"Job status query: {job_id} - {response['status']}")
        return response

    except Exception as exc:
        logger.warning(f"Job not found or error fetching status: {job_id} - {str(exc)}")
        raise HTTPException(
            status_code=404,
            detail=f"Job '{job_id}' not found or has expired"
        ) from exc


@router.get("/ingest/history")
async def get_ingestion_history(
    limit: int = 50,
    _: None = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Get the history of ingested documents.

    Returns a list of unique documents with their metadata from Qdrant.
    """
    try:
        from rag.pipeline import get_qdrant_client, COLLECTION_NAME

        client = get_qdrant_client()

        # Check if collection exists
        if not client.collection_exists(COLLECTION_NAME):
            return {"documents": [], "total": 0}

        # Scroll through points to get unique documents
        # We'll aggregate by filename from metadata
        documents_map: Dict[str, Dict[str, Any]] = {}

        offset = None
        batch_size = 100
        total_processed = 0

        while True:
            result = client.scroll(
                collection_name=COLLECTION_NAME,
                limit=batch_size,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )

            points, next_offset = result

            if not points:
                break

            for point in points:
                payload = point.payload or {}
                # Extract filename from document_id or use a default
                doc_id = payload.get("document_id", payload.get("doc_id", f"unknown_{point.id}"))

                # Store unique documents by document_id
                if doc_id not in documents_map:
                    documents_map[doc_id] = {
                        "id": doc_id,
                        "filename": doc_id,
                        "chunks": 0,
                        "created_at": None,  # Qdrant doesn't store timestamps by default
                    }

                documents_map[doc_id]["chunks"] += 1

            total_processed += len(points)

            if next_offset is None or total_processed >= limit * 10:
                break

            offset = next_offset

        # Convert to list and sort by chunks (most chunks first)
        documents = list(documents_map.values())
        documents.sort(key=lambda x: x["chunks"], reverse=True)

        # Limit results
        documents = documents[:limit]

        logger.info(f"Retrieved {len(documents)} unique documents from history")

        return {
            "documents": documents,
            "total": len(documents_map),
        }

    except Exception as exc:
        logger.error(f"Error retrieving ingestion history: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve ingestion history"
        ) from exc
