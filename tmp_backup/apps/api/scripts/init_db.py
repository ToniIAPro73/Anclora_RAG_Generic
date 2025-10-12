import sys
import os
from pathlib import Path

# Añadir el directorio actual al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database import init_database
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # Las variables ya están inyectadas por Docker Compose
    host = os.getenv('POSTGRES_HOST', 'localhost')
    database = os.getenv('POSTGRES_DB', 'anclora_rag')
    user = os.getenv('POSTGRES_USER', 'anclora_user')
    
    logger.info('Iniciando inicialización de base de datos...')
    logger.info(f'Host: {host}')
    logger.info(f'Database: {database}')
    logger.info(f'User: {user}')
    
    try:
        init_database()
        logger.info('✅ Base de datos inicializada correctamente')
    except Exception as e:
        logger.error(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
