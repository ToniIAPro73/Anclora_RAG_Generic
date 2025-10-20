from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

from models.batch import IngestionBatch, BatchStatus
from models.document import BatchDocument, DocumentStatus


class BatchManager:
    """
    Gestor de lotes de ingesta de documentos.
    Maneja el ciclo de vida completo: creación, seguimiento y finalización.
    """
    
    def __init__(self, db_session: Session):
        """
        Inicializa el BatchManager.
        
        Args:
            db_session: Sesión de SQLAlchemy para operaciones de BD
        """
        self.db = db_session
    
    async def create_batch(
        self, 
        user_id: UUID, 
        name: str,
        collection_name: str,
        description: Optional[str] = None
    ) -> UUID:
        """
        Crea un nuevo lote de ingesta.
        
        Args:
            user_id: UUID del usuario que crea el lote
            name: Nombre del lote
            collection_name: Nombre de la colección en Qdrant
            description: Descripción opcional del lote
            
        Returns:
            UUID del lote creado
        """
        batch = IngestionBatch(
            user_id=user_id,
            name=name,
            description=description,
            qdrant_collection=collection_name,
            status=BatchStatus.PENDING
        )
        
        # Insertar en base de datos
        insert_query = text("""
            INSERT INTO ingestion_batches 
            (id, user_id, name, description, status, qdrant_collection, created_at)
            VALUES 
            (:id, :user_id, :name, :description, :status, :collection, NOW())
            RETURNING id
        """)
        
        result = self.db.execute(
            insert_query,
            {
                "id": str(batch.id),
                "user_id": str(batch.user_id),
                "name": batch.name,
                "description": batch.description,
                "status": batch.status.value,
                "collection": batch.qdrant_collection
            }
        )
        self.db.commit()
        
        return batch.id
    
    async def add_file_to_batch(
        self,
        batch_id: UUID,
        filename: str,
        source_type: str,
        file_size: int,
        mime_type: Optional[str] = None
    ) -> UUID:
        """
        Añade un archivo al lote de ingesta.
        
        Args:
            batch_id: UUID del lote
            filename: Nombre del archivo
            source_type: Tipo de fuente ('file_upload', 'github', etc.)
            file_size: Tamaño del archivo en bytes
            mime_type: Tipo MIME del archivo
            
        Returns:
            UUID del documento creado
        """
        document = BatchDocument(
            batch_id=batch_id,
            filename=filename,
            source_type=source_type,
            file_size=file_size,
            mime_type=mime_type
        )
        
        # Insertar documento
        insert_doc_query = text("""
            INSERT INTO batch_documents 
            (id, batch_id, filename, source_type, file_size, mime_type, status, created_at)
            VALUES 
            (:id, :batch_id, :filename, :source_type, :file_size, :mime_type, :status, NOW())
            RETURNING id
        """)
        
        self.db.execute(
            insert_doc_query,
            {
                "id": str(document.id),
                "batch_id": str(batch_id),
                "filename": filename,
                "source_type": source_type,
                "file_size": file_size,
                "mime_type": mime_type,
                "status": document.status.value
            }
        )
        
        # Actualizar contador del batch
        update_batch_query = text("""
            UPDATE ingestion_batches 
            SET total_files = total_files + 1,
                total_size_bytes = total_size_bytes + :file_size
            WHERE id = :batch_id
        """)
        
        self.db.execute(
            update_batch_query,
            {"batch_id": str(batch_id), "file_size": file_size}
        )
        
        self.db.commit()
        return document.id
    
    async def update_progress(
        self,
        batch_id: UUID,
        doc_id: UUID,
        status: str,
        chunks_count: Optional[int] = None,
        error: Optional[str] = None
    ):
        """
        Actualiza el progreso de procesamiento de un documento.
        
        Args:
            batch_id: UUID del lote
            doc_id: UUID del documento
            status: Nuevo estado del documento
            chunks_count: Número de chunks generados (opcional)
            error: Mensaje de error si falló (opcional)
        """
        # Actualizar documento
        update_doc_query = text("""
            UPDATE batch_documents 
            SET status = :status,
                chunks_count = :chunks_count,
                error_message = :error,
                processed_at = NOW()
            WHERE id = :doc_id
        """)
        
        self.db.execute(
            update_doc_query,
            {
                "status": status,
                "chunks_count": chunks_count,
                "error": error,
                "doc_id": str(doc_id)
            }
        )
        
        # Obtener contadores actuales
        count_query = text("""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) as total
            FROM batch_documents 
            WHERE batch_id = :batch_id
        """)
        
        result = self.db.execute(count_query, {"batch_id": str(batch_id)}).fetchone()
        completed = result[0]
        failed = result[1]
        total = result[2]
        
        # Determinar estado del batch
        new_status = BatchStatus.PROCESSING
        completed_at = None
        
        if completed + failed == total:
            if failed == 0:
                new_status = BatchStatus.COMPLETED
            elif completed == 0:
                new_status = BatchStatus.FAILED
            else:
                new_status = BatchStatus.PARTIAL
            completed_at = datetime.utcnow()
        
        # Actualizar batch
        update_batch_query = text("""
            UPDATE ingestion_batches 
            SET processed_files = :processed,
                failed_files = :failed,
                status = :status,
                completed_at = :completed_at
            WHERE id = :batch_id
        """)
        
        self.db.execute(
            update_batch_query,
            {
                "processed": completed,
                "failed": failed,
                "status": new_status.value,
                "completed_at": completed_at,
                "batch_id": str(batch_id)
            }
        )
        
        self.db.commit()
    
    async def get_batch(self, batch_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Obtiene la información de un lote.
        
        Args:
            batch_id: UUID del lote
            
        Returns:
            Diccionario con la información del lote o None si no existe
        """
        query = text("""
            SELECT id, user_id, name, description, status, 
                   total_files, processed_files, failed_files, 
                   total_size_bytes, qdrant_collection, 
                   created_at, completed_at, error_summary
            FROM ingestion_batches 
            WHERE id = :batch_id
        """)
        
        result = self.db.execute(query, {"batch_id": str(batch_id)}).fetchone()
        
        if not result:
            return None
        
        return {
            "id": result[0],
            "user_id": result[1],
            "name": result[2],
            "description": result[3],
            "status": result[4],
            "total_files": result[5],
            "processed_files": result[6],
            "failed_files": result[7],
            "total_size_bytes": result[8],
            "qdrant_collection": result[9],
            "created_at": result[10],
            "completed_at": result[11],
            "error_summary": result[12]
        }
    
    async def get_batch_documents(self, batch_id: UUID) -> List[Dict[str, Any]]:
        """
        Obtiene todos los documentos de un lote.
        
        Args:
            batch_id: UUID del lote
            
        Returns:
            Lista de diccionarios con información de documentos
        """
        query = text("""
            SELECT id, batch_id, filename, source_type, file_size, 
                   mime_type, status, chunks_count, processed_at, 
                   error_message, created_at
            FROM batch_documents 
            WHERE batch_id = :batch_id
            ORDER BY created_at ASC
        """)
        
        results = self.db.execute(query, {"batch_id": str(batch_id)}).fetchall()
        
        return [
            {
                "id": row[0],
                "batch_id": row[1],
                "filename": row[2],
                "source_type": row[3],
                "file_size": row[4],
                "mime_type": row[5],
                "status": row[6],
                "chunks_count": row[7],
                "processed_at": row[8],
                "error_message": row[9],
                "created_at": row[10]
            }
            for row in results
        ]
