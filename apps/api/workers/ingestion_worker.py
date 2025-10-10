"""
Worker de procesamiento de documentos.
Maneja las tareas asíncronas de ingesta, parsing, chunking y embedding.
"""
import os
import sys
from pathlib import Path
from uuid import UUID
import logging

# Agregar raíz del proyecto al path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from apps.api.database.postgres_client import get_db_session
from apps.api.database.batch_manager import BatchManager
from apps.api.rag.pipeline import index_text
from packages.parsers.pdf import parse_pdf_bytes
from packages.parsers.docx_parser import parse_docx_bytes
from packages.parsers.markdown import parse_markdown_bytes
from packages.parsers.text import parse_text_bytes

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mapeo de parsers por tipo MIME
PARSER_MAP = {
    "application/pdf": parse_pdf_bytes,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parse_docx_bytes,
    "text/markdown": parse_markdown_bytes,
    "text/plain": parse_text_bytes,
}


def process_document_task(
    doc_id: str,
    batch_id: str,
    file_path: str,
    mime_type: str,
    collection_name: str
):
    """
    Task principal de procesamiento de documento.
    
    Flujo:
    1. Parseo → ParsedDocument
    2. Indexación → Qdrant (chunking + embeddings)
    3. Actualización de progreso en BD
    
    Args:
        doc_id: UUID del documento
        batch_id: UUID del lote
        file_path: Ruta al archivo temporal
        mime_type: Tipo MIME del archivo
        collection_name: Colección de Qdrant
    """
    logger.info(f"🔄 Procesando documento {doc_id} del batch {batch_id}")
    
    db_session = get_db_session()
    batch_manager = BatchManager(db_session)
    
    try:
        # 1. Obtener parser apropiado
        parser = PARSER_MAP.get(mime_type)
        if not parser:
            raise ValueError(f"No hay parser disponible para {mime_type}")
        
        # 2. Leer y parsear archivo
        logger.info(f"📄 Parseando archivo: {file_path}")
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        
        text = parser(file_bytes)
        
        if not text or not text.strip():
            raise ValueError("Contenido vacío después del parseo")
        
        logger.info(f"✅ Parseo exitoso: {len(text)} caracteres")
        
        # 3. Indexar en Qdrant (incluye chunking + embeddings)
        logger.info(f"🔢 Indexando en Qdrant (colección: {collection_name})")
        chunks_count = index_text(doc_id=doc_id, text=text)
        
        logger.info(f"✅ Indexación exitosa: {chunks_count} chunks creados")
        
        # 4. Actualizar progreso a "completed"
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(
            batch_manager.update_progress(
                batch_id=UUID(batch_id),
                doc_id=UUID(doc_id),
                status="completed",
                chunks_count=chunks_count
            )
        )
        loop.close()
        
        logger.info(f"🎉 Documento {doc_id} procesado exitosamente")
        
    except Exception as e:
        logger.error(f"❌ Error procesando documento {doc_id}: {str(e)}")
        
        # Actualizar progreso a "failed"
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(
            batch_manager.update_progress(
                batch_id=UUID(batch_id),
                doc_id=UUID(doc_id),
                status="failed",
                error=str(e)
            )
        )
        loop.close()
        
        raise
    
    finally:
        db_session.close()
        
        # Limpiar archivo temporal
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"🗑️  Archivo temporal eliminado: {file_path}")
            except Exception as e:
                logger.warning(f"⚠️  No se pudo eliminar archivo temporal: {e}")


def process_github_repo_task(
    batch_id: str,
    repo_url: str,
    branch: str = "main",
    include_patterns: list = None
):
    """
    Task para procesar un repositorio completo de GitHub.
    
    Args:
        batch_id: UUID del lote
        repo_url: URL del repositorio
        branch: Rama a procesar
        include_patterns: Patrones de archivos a incluir
    """
    logger.info(f"🔄 Procesando repositorio GitHub: {repo_url}")
    
    # TODO: Implementar procesamiento de repositorios GitHub
    # Requiere GitHubRepoParser del documento técnico
    
    logger.warning("⚠️  Procesamiento de repositorios GitHub aún no implementado")
    pass
