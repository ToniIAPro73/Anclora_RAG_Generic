"""Structured logging configuration with correlation IDs for request tracing."""

import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime
from typing import Any, Dict, Optional

# Context variable to store correlation ID for the current request
correlation_id_var: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)


class CorrelationIdFilter(logging.Filter):
    """Add correlation ID to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Inject correlation_id into the log record."""
        record.correlation_id = correlation_id_var.get() or "N/A"
        return True


class StructuredFormatter(logging.Formatter):
    """Format log records as structured JSON for easier parsing."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON string."""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": getattr(record, "correlation_id", "N/A"),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)

        # Format as single-line JSON (compact)
        import json

        return json.dumps(log_data, ensure_ascii=False)


def setup_logging(level: str = "INFO", use_json: bool = False) -> None:
    """
    Configure application-wide logging.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_json: If True, use structured JSON logging; if False, use human-readable format
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper()))

    # Add correlation ID filter
    correlation_filter = CorrelationIdFilter()
    console_handler.addFilter(correlation_filter)

    # Choose formatter
    if use_json:
        formatter = StructuredFormatter()
    else:
        # Human-readable format for development
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(correlation_id)s | %(name)s:%(funcName)s:%(lineno)d | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("fsspec").setLevel(logging.WARNING)


def get_correlation_id() -> str:
    """Get the current correlation ID, or generate a new one if none exists."""
    correlation_id = correlation_id_var.get()
    if not correlation_id:
        correlation_id = str(uuid.uuid4())
        correlation_id_var.set(correlation_id)
    return correlation_id


def set_correlation_id(correlation_id: str) -> None:
    """Set the correlation ID for the current context."""
    correlation_id_var.set(correlation_id)


def clear_correlation_id() -> None:
    """Clear the correlation ID from the current context."""
    correlation_id_var.set(None)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.

    This is a convenience wrapper around logging.getLogger that ensures
    proper configuration.

    Args:
        name: Logger name (typically __name__ from the calling module)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


class LoggerAdapter(logging.LoggerAdapter):
    """Custom logger adapter that adds extra fields to log records."""

    def process(self, msg: str, kwargs: Any) -> tuple:
        """Process log message and add extra fields."""
        # Extract keyword arguments that should be part of the message
        extra_fields = {}
        keys_to_remove = []

        for key, value in kwargs.items():
            if key not in ("exc_info", "stack_info", "stacklevel", "extra"):
                extra_fields[key] = value
                keys_to_remove.append(key)

        # Remove these keys from kwargs
        for key in keys_to_remove:
            del kwargs[key]

        # Build extra dict
        extra = kwargs.get("extra", {})
        extra["correlation_id"] = get_correlation_id()

        if extra_fields:
            extra["extra_fields"] = extra_fields

        kwargs["extra"] = extra
        return msg, kwargs


def get_structured_logger(name: str, **default_fields: Any) -> LoggerAdapter:
    """
    Get a structured logger that automatically includes correlation ID and default fields.

    Args:
        name: Logger name
        **default_fields: Additional fields to include in all log messages

    Returns:
        LoggerAdapter instance

    Example:
        >>> logger = get_structured_logger(__name__, service="api", version="1.0.0")
        >>> logger.info("Processing request", user_id=123, endpoint="/ingest")
    """
    base_logger = logging.getLogger(name)
    return LoggerAdapter(base_logger, default_fields)
