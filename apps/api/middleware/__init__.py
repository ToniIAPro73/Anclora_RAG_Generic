"""Middleware for FastAPI application."""

from .correlation_id import CorrelationIdMiddleware

__all__ = ["CorrelationIdMiddleware"]
