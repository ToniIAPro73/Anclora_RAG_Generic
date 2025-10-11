import os
import logging
from contextlib import contextmanager
from urllib.parse import quote_plus

import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

logger = logging.getLogger(__name__)

_ENGINE = None
_SessionLocal = None


def get_connection_params():
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", 5432)),
        "database": os.getenv("POSTGRES_DB", "anclora_rag"),
        "user": os.getenv("POSTGRES_USER", "anclora_user"),
        "password": os.getenv("POSTGRES_PASSWORD", "")
    }


def _build_sqlalchemy_url(params: dict) -> str:
    password = quote_plus(params["password"]) if params["password"] else ""
    return (
        f"postgresql+psycopg2://{params['user']}:{password}" 
        f"@{params['host']}:{params['port']}/{params['database']}"
    )


def init_db_engine():
    global _ENGINE, _SessionLocal
    if _ENGINE is None:
        params = get_connection_params()
        url = _build_sqlalchemy_url(params)
        _ENGINE = create_engine(url, pool_pre_ping=True)
        _SessionLocal = sessionmaker(bind=_ENGINE, autocommit=False, autoflush=False)
    return _ENGINE


def get_db_session() -> Session:
    if _SessionLocal is None:
        init_db_engine()
    return _SessionLocal()


def _connect():
    return psycopg2.connect(**get_connection_params())


@contextmanager
def get_db_connection():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception as exc:
        conn.rollback()
        logger.error('Database error: %s', exc)
        raise
    finally:
        conn.close()


def execute_query(query: str, params=None, fetch: bool = False):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch:
                return cur.fetchall()
            return cur.rowcount


def fetch_one(query: str, params=None):
    rows = execute_query(query, params=params, fetch=True)
    if rows:
        return rows[0]
    return None
