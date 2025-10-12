from .postgres_client import execute_query
import logging

logger = logging.getLogger(__name__)

SCHEMA_SQL = '''
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de batches de ingesta
CREATE TABLE IF NOT EXISTS ingestion_batches (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    qdrant_collection VARCHAR(255) NOT NULL,
    total_files INTEGER DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_summary JSONB,
    metadata JSONB
);

-- Tabla de documentos individuales
CREATE TABLE IF NOT EXISTS batch_documents (
    id UUID PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES ingestion_batches(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    processed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_batches_status ON ingestion_batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_user ON ingestion_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_batch ON batch_documents(batch_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON batch_documents(status);

-- Tabla de usuarios de aplicación
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','viewer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

-- Cuentas sociales vinculadas
CREATE TABLE IF NOT EXISTS user_social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_account_id)
);

-- Tokens de reseteo de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
'''

def init_database():
    try:
        logger.info('Inicializando esquema de base de datos...')
        execute_query(SCHEMA_SQL)
        logger.info('Esquema de base de datos inicializado correctamente')
        return True
    except Exception as e:
        logger.error(f'Error al inicializar base de datos: {e}')
        raise
