"""Middleware for correlation ID injection and request logging."""

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from utils.logging_config import clear_correlation_id, set_correlation_id

logger = logging.getLogger(__name__)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Extracts or generates a correlation ID for each request
    2. Injects it into the request context
    3. Adds it to the response headers
    4. Logs request/response with timing information
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and add correlation ID."""
        # Extract correlation ID from header or generate new one
        correlation_id = request.headers.get("X-Correlation-ID") or request.headers.get(
            "X-Request-ID"
        ) or str(uuid.uuid4())

        # Set correlation ID in context
        set_correlation_id(correlation_id)

        # Log incoming request
        start_time = time.time()
        logger.info(
            f"Incoming request: {request.method} {request.url.path} "
            f"from {request.client.host if request.client else 'unknown'}"
        )

        try:
            # Process request
            response = await call_next(request)

            # Calculate request duration
            duration_ms = (time.time() - start_time) * 1000

            # Add correlation ID to response headers
            response.headers["X-Correlation-ID"] = correlation_id

            # Log response
            logger.info(
                f"Request completed: {request.method} {request.url.path} "
                f"status={response.status_code} duration={round(duration_ms, 2)}ms"
            )

            return response

        except Exception as exc:
            # Calculate request duration even on error
            duration_ms = (time.time() - start_time) * 1000

            # Log error
            logger.error(
                f"Request failed: {request.method} {request.url.path} "
                f"duration={round(duration_ms, 2)}ms error={str(exc)}",
                exc_info=True,
            )

            # Re-raise exception to be handled by FastAPI error handlers
            raise

        finally:
            # Clean up correlation ID from context
            clear_correlation_id()
