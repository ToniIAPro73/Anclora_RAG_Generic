"""Redis Queue client for async job management."""

import logging
import os
from typing import Optional

import redis
from rq import Queue

logger = logging.getLogger(__name__)

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
_redis_conn: Optional[redis.Redis] = None
_ingestion_queue: Optional[Queue] = None


def get_redis_connection() -> redis.Redis:
    """Get or create Redis connection."""
    global _redis_conn
    if _redis_conn is None:
        logger.info(f"Connecting to Redis at {REDIS_URL}")
        _redis_conn = redis.from_url(REDIS_URL)
        # Test connection
        _redis_conn.ping()
        logger.info("Redis connection established")
    return _redis_conn


def get_ingestion_queue() -> Queue:
    """Get or create ingestion queue."""
    global _ingestion_queue
    if _ingestion_queue is None:
        conn = get_redis_connection()
        _ingestion_queue = Queue("ingestion", connection=conn, default_timeout=600)
        logger.info("Ingestion queue initialized")
    return _ingestion_queue


def close_redis_connection() -> None:
    """Close Redis connection (for cleanup)."""
    global _redis_conn, _ingestion_queue
    if _redis_conn is not None:
        _redis_conn.close()
        _redis_conn = None
        _ingestion_queue = None
        logger.info("Redis connection closed")
