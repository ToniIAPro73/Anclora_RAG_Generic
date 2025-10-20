"""
API endpoints para el sistema de waitlist (T003)
"""
from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from pydantic import ValidationError

from apps.api.database.waitlist_repository import WaitlistRepository
from apps.api.models.waitlist import (
    WaitlistCreate,
    WaitlistResponse,
    WaitlistError,
    WaitlistErrorCode
)
from apps.api.utils.logging_config import get_logger
from apps.api.middleware import limiter
from apps.api.clients.email_client import email_client

logger = get_logger(__name__)

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])


@router.post(
    "",
    response_model=WaitlistResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": WaitlistError, "description": "Email inválido"},
        409: {"model": WaitlistError, "description": "Email ya registrado"},
        429: {"model": WaitlistError, "description": "Rate limit excedido"},
    }
)
@limiter.limit("5/minute")
async def add_to_waitlist(
    waitlist_data: WaitlistCreate,
    request: Request
) -> WaitlistResponse:
    """
    Añade un email a la waitlist.

    Args:
        waitlist_data: Email y referral source
        request: Request object de FastAPI

    Returns:
        WaitlistResponse con mensaje de éxito y posición en cola

    Raises:
        HTTPException 400: Email inválido
        HTTPException 409: Email ya existe en waitlist
        HTTPException 429: Rate limit excedido
    """
    repo = WaitlistRepository()

    try:
        # Verificar si ya existe
        if repo.email_exists(waitlist_data.email):
            logger.warning(
                f"Email duplicado en waitlist: {waitlist_data.email}",
                extra={
                    "email": waitlist_data.email,
                    "ip": request.client.host if request.client else "unknown"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "Este email ya está registrado en la waitlist",
                    "code": WaitlistErrorCode.DUPLICATE_EMAIL
                }
            )

        # Crear entrada
        entry = repo.add_to_waitlist(waitlist_data)

        # Obtener posición y total
        position = repo.get_position(entry.email)
        total_pending = repo.get_waitlist_count()

        logger.info(
            f"Email añadido a waitlist: {entry.email}",
            extra={
                "email": entry.email,
                "referral_source": entry.referral_source,
                "position": position,
                "ip": request.client.host if request.client else "unknown"
            }
        )

        # Enviar email de confirmación (async, no bloquea la respuesta)
        try:
            email_sent = await email_client.send_template_email(
                to=entry.email,
                subject="¡Bienvenido a la Waitlist de Anclora! 🎉",
                template_name="waitlist_confirmation.html",
                template_vars={
                    "email": entry.email,
                    "position": position,
                    "total_pending": total_pending
                }
            )

            if email_sent:
                logger.info(
                    f"Confirmation email sent to {entry.email}",
                    extra={"email": entry.email, "position": position}
                )
            else:
                logger.warning(
                    f"Failed to send confirmation email to {entry.email}",
                    extra={"email": entry.email}
                )

        except Exception as e:
            # No fallar la request si falla el email, solo log
            logger.error(
                f"Error sending confirmation email: {str(e)}",
                extra={"email": entry.email},
                exc_info=True
            )

        return WaitlistResponse(
            success=True,
            message="¡Genial! Te hemos añadido a la lista de espera. Recibirás un email de confirmación en breve.",
            position=position
        )

    except IntegrityError as e:
        logger.error(
            f"Error de integridad en waitlist: {str(e)}",
            extra={"email": waitlist_data.email}
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "success": False,
                "error": "Este email ya está registrado en la waitlist",
                "code": WaitlistErrorCode.DUPLICATE_EMAIL
            }
        )

    except ValidationError as e:
        logger.error(
            f"Error de validación en waitlist: {str(e)}",
            extra={"email": waitlist_data.email}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": "Email inválido",
                "code": WaitlistErrorCode.INVALID_EMAIL
            }
        )

    except Exception as e:
        logger.error(
            f"Error interno en waitlist: {str(e)}",
            extra={"email": waitlist_data.email},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "Error interno del servidor. Por favor, intenta nuevamente.",
                "code": WaitlistErrorCode.INTERNAL_ERROR
            }
        )

    finally:
        repo.close()


@router.get(
    "/stats",
    response_model=dict,
    tags=["waitlist", "admin"]
)
async def get_waitlist_stats() -> dict:
    """
    Obtiene estadísticas de la waitlist (endpoint admin).

    Returns:
        Diccionario con estadísticas de waitlist
    """
    repo = WaitlistRepository()

    try:
        count = repo.get_waitlist_count()

        return {
            "total_pending": count,
            "message": f"{count} personas en lista de espera"
        }

    finally:
        repo.close()
