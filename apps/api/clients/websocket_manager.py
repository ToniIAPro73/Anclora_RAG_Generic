"""WebSocket connection manager for real-time job status updates."""

import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for job status updates."""

    def __init__(self):
        # Map of job_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Redis pubsub instance
        self._pubsub = None
        self._pubsub_task = None

    async def _redis_listener(self):
        """Background task to listen for Redis pub/sub messages and forward to WebSockets."""
        from clients.redis_queue import get_redis_connection

        redis_conn = get_redis_connection()
        self._pubsub = redis_conn.pubsub()

        # Subscribe to all job channels
        self._pubsub.psubscribe("job:*")

        logger.info("Redis pub/sub listener started")

        try:
            while True:
                message = self._pubsub.get_message()
                if message and message["type"] == "pmessage":
                    try:
                        data = json.loads(message["data"])
                        job_id = data.get("job_id")

                        if job_id:
                            await self.send_job_update(job_id, data)

                    except json.JSONDecodeError as exc:
                        logger.warning(f"Invalid JSON from Redis: {exc}")
                    except Exception as exc:
                        logger.error(f"Error processing Redis message: {exc}")

                await asyncio.sleep(0.01)  # Small delay to prevent busy loop

        except asyncio.CancelledError:
            logger.info("Redis pub/sub listener stopped")
            if self._pubsub:
                self._pubsub.close()
        except Exception as exc:
            logger.error(f"Redis pub/sub listener error: {exc}")

    def start_listener(self):
        """Start the Redis pub/sub listener if not already running."""
        if self._pubsub_task is None or self._pubsub_task.done():
            self._pubsub_task = asyncio.create_task(self._redis_listener())
            logger.info("Started Redis pub/sub listener task")

    async def connect(self, websocket: WebSocket, job_id: str):
        """Accept a WebSocket connection and subscribe to job updates."""
        await websocket.accept()

        if job_id not in self.active_connections:
            self.active_connections[job_id] = set()

        self.active_connections[job_id].add(websocket)
        logger.info(f"WebSocket connected for job {job_id}. Total connections: {len(self.active_connections[job_id])}")

        # Ensure Redis listener is running
        self.start_listener()

    def disconnect(self, websocket: WebSocket, job_id: str):
        """Remove a WebSocket connection."""
        if job_id in self.active_connections:
            self.active_connections[job_id].discard(websocket)

            # Clean up empty sets
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]

            logger.info(f"WebSocket disconnected for job {job_id}")

    async def send_job_update(self, job_id: str, message: dict):
        """Send a message to all connections subscribed to a job."""
        if job_id not in self.active_connections:
            logger.debug(f"No active connections for job {job_id}")
            return

        disconnected = set()

        for connection in self.active_connections[job_id]:
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"Failed to send message to WebSocket for job {job_id}: {str(exc)}")
                disconnected.add(connection)

        # Clean up disconnected sockets
        for connection in disconnected:
            self.disconnect(connection, job_id)

    async def broadcast(self, message: dict):
        """Broadcast a message to all active connections."""
        for job_id in list(self.active_connections.keys()):
            await self.send_job_update(job_id, message)


# Global singleton instance
ws_manager = ConnectionManager()


def get_ws_manager() -> ConnectionManager:
    """Get the global WebSocket manager instance."""
    return ws_manager
