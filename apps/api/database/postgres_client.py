import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

def get_connection_params():
    return {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': int(os.getenv('POSTGRES_PORT', 5432)),
        'database': os.getenv('POSTGRES_DB', 'anclora_rag'),
        'user': os.getenv('POSTGRES_USER', 'anclora_user'),
        'password': os.getenv('POSTGRES_PASSWORD', '')
    }

@contextmanager
def get_db_connection():
    conn = psycopg2.connect(**get_connection_params())
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f'Database error: {e}')
        raise
    finally:
        conn.close()

def execute_query(query, params=None, fetch=False):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch:
                return cur.fetchall()
            return cur.rowcount
