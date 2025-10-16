"""
Endpoints para gestión de batches de ingesta.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel
import os
import tempfile
from pathlib import Path
from redis import Redis
from rq import Queue
from sqlalchemy.orm import Session

from database.postgres_client import get_db
from database.batch_manager import BatchManager
from workers.ingestion_worker import process_document_task


router = APIRouter(prefix="/batch", tags=["batch"])


# ============ MODELOS PYDANTIC ============

class CreateBatchRequest(BaseModel):
    """Request para crear un nuevo batch."""
    name: str
    collection_name: str
    description: Optional[str] = None


class BatchResponse(BaseModel):
    """Response con información del batch."""
    batch_id: str
    status: str
    message: str


class BatchStatusResponse(BaseModel):
    """Response detallado del estado de un batch."""
    batch: dict
    documents: List[dict]
    statistics: dict
    progress_percentage: float


# ============ REDIS/RQ CLIENT ============

def get_redis_queue() -> Queue:
    """Obtiene la cola de Redis para enqueue de tareas."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_conn = Redis.from_url(redis_url)
    return Queue("ingestion_queue", connection=redis_conn)


# ============ ENDPOINTS ============

@router.post("/create", response_model=BatchResponse)
async def create_batch(
    request: CreateBatchRequest,
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo batch de ingesta.
    
    Args:
        request: Datos del batch (nombre, colección, descripción)
        db: Sesión de base de datos
        
    Returns:
        Información del batch creado
    """
    try:
        batch_manager = BatchManager(db)
        
        # Por ahora usamos un user_id fijo (TODO: integrar autenticación)
        user_id = uuid4()
        
        batch_id = await batch_manager.create_batch(
            user_id=user_id,
            name=request.name,
            collection_name=request.collection_name,
            description=request.description
        )
        
        return BatchResponse(
            batch_id=str(batch_id),
            status="created",
            message=f"Batch '{request.name}' creado exitosamente"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creando batch: {str(e)}"
        )


@router.post("/{batch_id}/upload", response_model=dict)
async def upload_files_to_batch(
    batch_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Sube archivos a un batch existente y encola su procesamiento.
    
    Args:
        batch_id: UUID del batch
        files: Lista de archivos a subir
        db: Sesión de base de datos
        
    Returns:
        Información de los archivos encolados
    """
    try:
        batch_manager = BatchManager(db)
        queue = get_redis_queue()
        
        # Verificar que el batch existe
        batch = await batch_manager.get_batch(batch_id)
        if not batch:
            raise HTTPException(404, "Batch no encontrado")
        
        # Directorio temporal para archivos
        temp_dir = Path(tempfile.gettempdir()) / "anclora_rag" / str(batch_id)
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        uploaded_files = []
        
        for file in files:
            # Guardar archivo temporalmente
            file_path = temp_dir / file.filename
            
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Registrar documento en BD
            doc_id = await batch_manager.add_file_to_batch(
                batch_id=batch_id,
                filename=file.filename,
                source_type="file_upload",
                file_size=len(content),
                mime_type=file.content_type
            )
            
            # Encolar tarea de procesamiento
            job = queue.enqueue(
                process_document_task,
                doc_id=str(doc_id),
                batch_id=str(batch_id),
                file_path=str(file_path),
                mime_type=file.content_type,
                collection_name=batch["qdrant_collection"],
                job_timeout="30m"
            )
            
            uploaded_files.append({
                "document_id": str(doc_id),
                "filename": file.filename,
                "job_id": job.id,
                "status": "queued"
            })
        
        return {
            "batch_id": str(batch_id),
            "uploaded_files": len(files),
            "documents": uploaded_files,
            "message": f"{len(files)} archivo(s) encolado(s) para procesamiento"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error subiendo archivos: {str(e)}"
        )


@router.get("/{batch_id}/status", response_model=BatchStatusResponse)
async def get_batch_status(
    batch_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Obtiene el estado detallado de un batch.
    
    Args:
        batch_id: UUID del batch
        db: Sesión de base de datos
        
    Returns:
        Estado completo del batch con documentos y estadísticas
    """
    try:
        batch_manager = BatchManager(db)
        
        # Obtener información del batch
        batch = await batch_manager.get_batch(batch_id)
        if not batch:
            raise HTTPException(404, "Batch no encontrado")
        
        # Obtener documentos
        documents = await batch_manager.get_batch_documents(batch_id)
        
        # Calcular estadísticas
        total = len(documents)
        stats = {
            "total": total,
            "pending": sum(1 for d in documents if d['status'] == 'pending'),
            "processing": sum(1 for d in documents if d['status'] == 'processing'),
            "completed": sum(1 for d in documents if d['status'] == 'completed'),
            "failed": sum(1 for d in documents if d['status'] == 'failed')
        }
        
        # Calcular porcentaje de progreso
        progress = (stats['completed'] / total * 100) if total > 0 else 0
        
        return BatchStatusResponse(
            batch=batch,
            documents=documents,
            statistics=stats,
            progress_percentage=round(progress, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo estado: {str(e)}"
        )


@router.get("/list", response_model=List[dict])
async def list_batches(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Lista todos los batches.
    
    Args:
        limit: Número máximo de batches a retornar
        offset: Número de batches a saltar (paginación)
        db: Sesión de base de datos
        
    Returns:
        Lista de batches
    """
    try:
        from sqlalchemy import text
        
        query = text("""
            SELECT id, user_id, name, description, status, 
                   total_files, processed_files, failed_files,
                   created_at, completed_at
            FROM ingestion_batches
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        results = db.execute(query, {"limit": limit, "offset": offset}).fetchall()
        
        batches = [
            {
                "id": str(row[0]),
                "user_id": str(row[1]),
                "name": row[2],
                "description": row[3],
                "status": row[4],
                "total_files": row[5],
                "processed_files": row[6],
                "failed_files": row[7],
                "created_at": row[8].isoformat() if row[8] else None,
                "completed_at": row[9].isoformat() if row[9] else None
            }
            for row in results
        ]
        
        return batches
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listando batches: {str(e)}"
        )
