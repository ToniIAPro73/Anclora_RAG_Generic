import sys
import os
from pathlib import Path

# Añadir apps/api al path
sys.path.insert(0, str(Path(__file__).parent.parent / 'apps' / 'api'))

from database import init_database
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # Cargar variables de entorno
    env_path = Path(__file__).parent.parent / '.env'
    load_dotenv(env_path)
    
    logger.info('Iniciando inicialización de base de datos...')
    host = os.getenv('POSTGRES_HOST')
    database = os.getenv('POSTGRES_DB')
    logger.info(f'Host: {host}')
    logger.info(f'Database: {database}')
    
    try:
        init_database()
        logger.info('✅ Base de datos inicializada correctamente')
    except Exception as e:
        logger.error(f'❌ Error: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()
