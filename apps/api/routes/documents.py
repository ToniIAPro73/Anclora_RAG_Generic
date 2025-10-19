"""Documents management endpoints (list, delete, get details)."""
import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from qdrant_client.models import Filter, FieldCondition, MatchValue

from deps import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(tags=["documents"])


@router.delete("/documents/{document_id:path}")
async def delete_document(
    document_id: str,
    _: None = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Delete a document and all its associated chunks from the vector store.

    Args:
        document_id: The document_id (filename) to delete

    Returns:
        Success message with deletion count
    """
    try:
        from rag.pipeline import get_qdrant_client, COLLECTION_NAME

        client = get_qdrant_client()

        # Check if collection exists
        if not client.collection_exists(COLLECTION_NAME):
            raise HTTPException(
                status_code=404,
                detail="Document collection does not exist"
            )

        # URL decode the document_id in case it contains special characters
        from urllib.parse import unquote
        document_id = unquote(document_id)

        logger.info(f"Attempting to delete document: {document_id}")

        # Delete all points with matching document_id
        delete_result = client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            ),
        )

        # Check if any points were deleted
        if hasattr(delete_result, 'status') and delete_result.status == 'completed':
            logger.info(f"Document deleted successfully: {document_id}")
            return {
                "success": True,
                "document_id": document_id,
                "filename": document_id,
                "message": f"Document '{document_id}' and all its chunks have been deleted"
            }
        else:
            # No points found with this document_id
            logger.warning(f"No document found with ID: {document_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Document '{document_id}' not found"
            )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error deleting document {document_id}: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(exc)}"
        ) from exc


@router.delete("/documents")
async def delete_all_documents(
    _: None = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Delete ALL documents and chunks from the vector store.

    WARNING: This operation cannot be undone. It will completely clear
    the RAG knowledge base.

    Returns:
        Success message with deletion count
    """
    try:
        from rag.pipeline import get_qdrant_client, COLLECTION_NAME

        client = get_qdrant_client()

        # Check if collection exists
        if not client.collection_exists(COLLECTION_NAME):
            logger.warning("Collection does not exist, nothing to delete")
            return {
                "success": True,
                "message": "No documents to delete (collection does not exist)",
                "deleted_count": 0
            }

        # Count points before deletion
        collection_info = client.get_collection(COLLECTION_NAME)
        total_points = collection_info.points_count if hasattr(collection_info, 'points_count') else 0

        logger.warning(f"Deleting ALL documents from collection: {total_points} points")

        # Delete the entire collection and recreate it
        client.delete_collection(COLLECTION_NAME)

        # Recreate empty collection
        from rag.pipeline import ensure_collection
        ensure_collection(client, COLLECTION_NAME)

        logger.info(f"All documents deleted successfully: {total_points} chunks removed")

        return {
            "success": True,
            "message": f"All documents have been deleted ({total_points} chunks removed)",
            "deleted_count": total_points
        }

    except Exception as exc:
        logger.error(f"Error deleting all documents: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete all documents: {str(exc)}"
        ) from exc


@router.get("/documents/{document_id:path}")
async def get_document_details(
    document_id: str,
    _: None = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Get detailed information about a specific document.

    Args:
        document_id: The document_id (filename) to retrieve

    Returns:
        Document details including all chunks
    """
    try:
        from rag.pipeline import get_qdrant_client, COLLECTION_NAME

        client = get_qdrant_client()

        # Check if collection exists
        if not client.collection_exists(COLLECTION_NAME):
            raise HTTPException(
                status_code=404,
                detail="Document collection does not exist"
            )

        # URL decode the document_id in case it contains special characters
        from urllib.parse import unquote
        document_id = unquote(document_id)

        # Search for all points with this document_id
        result = client.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            ),
            limit=1000,  # Max chunks per document
            with_payload=True,
            with_vectors=False,
        )

        points, _ = result

        if not points:
            raise HTTPException(
                status_code=404,
                detail=f"Document '{document_id}' not found"
            )

        # Collect all chunks and extract text from node content
        chunks = []
        for point in points:
            payload = point.payload or {}

            # The text is stored in the _node_content field by LlamaIndex
            text = ""
            if "_node_content" in payload:
                # Parse the JSON content
                import json
                try:
                    node_content = json.loads(payload["_node_content"]) if isinstance(payload["_node_content"], str) else payload["_node_content"]
                    text = node_content.get("text", "")
                except (json.JSONDecodeError, AttributeError):
                    # Fallback: try to get text directly
                    text = str(payload.get("_node_content", ""))

            chunks.append({
                "chunk_id": str(point.id),
                "text": text,
                "page": payload.get("page"),
                "chunk_index": payload.get("chunk_index"),
            })

        # Sort chunks by chunk_index if available
        chunks.sort(key=lambda x: x.get("chunk_index", 0) if x.get("chunk_index") is not None else 0)

        return {
            "document_id": document_id,
            "filename": document_id,
            "chunk_count": len(chunks),
            "chunks": chunks,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving document {document_id}: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve document details: {str(exc)}"
        ) from exc
