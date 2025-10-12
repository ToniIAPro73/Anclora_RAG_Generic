"""
Script de inicialización de la base de datos PostgreSQL.
Crea las tablas necesarias si no existen.
"""
import sys
from pathlib import Path

# Agregar raíz del proyecto al path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from apps.api.database.postgres_client import get_db_session, init_db_engine
from sqlalchemy import text


def create_tables():
    """Crea las tablas necesarias en PostgreSQL."""
    
    # Inicializar motor de base de datos
    init_db_engine()
    session = get_db_session()
    
    try:
        # Habilitar extensión UUID
        session.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        session.commit()
        
        # SQL para crear tabla de batches
        create_batches_table = text("""
        CREATE TABLE IF NOT EXISTS ingestion_batches (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            total_files INTEGER DEFAULT 0,
            processed_files INTEGER DEFAULT 0,
            failed_files INTEGER DEFAULT 0,
            total_size_bytes BIGINT DEFAULT 0,
            qdrant_collection TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            error_summary JSONB
        );
        """)
        
        # SQL para crear tabla de documentos
        create_documents_table = text("""
        CREATE TABLE IF NOT EXISTS batch_documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            batch_id UUID NOT NULL REFERENCES ingestion_batches(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            source_type TEXT NOT NULL,
            file_size BIGINT NOT NULL,
            mime_type TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            chunks_count INTEGER,
            processed_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """)
        
        # Crear índices
        create_indexes = text("""
        CREATE INDEX IF NOT EXISTS idx_batch_documents_batch_id 
            ON batch_documents(batch_id);
        CREATE INDEX IF NOT EXISTS idx_batch_documents_status 
            ON batch_documents(status);
        CREATE INDEX IF NOT EXISTS idx_ingestion_batches_status 
            ON ingestion_batches(status);
        CREATE INDEX IF NOT EXISTS idx_ingestion_batches_user_id 
            ON ingestion_batches(user_id);
        """)

        # SQL para usuarios
        create_users_table = text("""
        CREATE TABLE IF NOT EXISTS app_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin','viewer')),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)

        create_social_accounts = text("""
        CREATE TABLE IF NOT EXISTS user_social_accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            provider_account_id TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(provider, provider_account_id)
        );
        """)

        create_reset_tokens = text("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
            token TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)
        
        print("🔧 Creando tabla 'ingestion_batches'...")
        session.execute(create_batches_table)
        session.commit()
        
        print("🔧 Creando tabla 'batch_documents'...")
        session.execute(create_documents_table)
        session.commit()
        
        print("🔧 Creando tabla 'app_users'...")
        session.execute(create_users_table)
        session.commit()

        print("🔧 Creando tabla 'user_social_accounts'...")
        session.execute(create_social_accounts)
        session.commit()

        print("🔧 Creando tabla 'password_reset_tokens'...")
        session.execute(create_reset_tokens)
        session.commit()

        print("🔧 Creando índices...")
        session.execute(create_indexes)
        session.commit()
        
        print("✅ Base de datos inicializada correctamente")
        return True
        
    except Exception as e:
        print(f"❌ Error inicializando base de datos: {str(e)}")
        session.rollback()
        return False
        
    finally:
        session.close()


if __name__ == "__main__":
    print("=" * 60)
    print("INICIALIZACIÓN DE BASE DE DATOS - ANCLORA RAG (PostgreSQL)")
    print("=" * 60)
    create_tables()
