"""
Rate limiting middleware usando slowapi (T004)
"""
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_limiter() -> Limiter:
    """
    Crea y retorna una instancia de Limiter para rate limiting.

    Returns:
        Limiter configurado con storage en memoria
    """
    return Limiter(
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://",
        strategy="fixed-window"
    )


# Instancia global del limiter
limiter = get_limiter()
