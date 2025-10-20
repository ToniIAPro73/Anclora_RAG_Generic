"""
Cliente de email usando Hostinger SMTP con fastapi-mail (T006)
"""
import os
from typing import List, Dict, Any

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

from utils.logging_config import get_logger

logger = get_logger(__name__)


# Configuración de conexión SMTP de Hostinger
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USER", "noreply@anclora.com"),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD", ""),
    MAIL_FROM=os.getenv("SMTP_FROM", "noreply@anclora.com"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", "465")),
    MAIL_SERVER=os.getenv("SMTP_HOST", "smtp.hostinger.com"),
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    MAIL_FROM_NAME=os.getenv("SMTP_FROM_NAME", "Anclora")
)


class EmailClient:
    """Cliente para enviar emails via Hostinger SMTP"""

    def __init__(self):
        """Inicializa el cliente de email"""
        self.fm = FastMail(conf)
        logger.info(
            f"Email client initialized - server={conf.MAIL_SERVER} port={conf.MAIL_PORT}"
        )

    async def send_email(
        self,
        to: EmailStr | List[EmailStr],
        subject: str,
        html_body: str,
        text_body: str | None = None,
        from_name: str | None = None
    ) -> bool:
        """
        Envía un email via Hostinger SMTP.

        Args:
            to: Email(s) del destinatario
            subject: Asunto del email
            html_body: Cuerpo del email en HTML
            text_body: Cuerpo del email en texto plano (opcional)
            from_name: Nombre del remitente (opcional, por defecto "Anclora")

        Returns:
            True si el email se envió correctamente, False en caso de error
        """
        try:
            # Convertir to a lista si es un string
            recipients = [to] if isinstance(to, str) else to

            # Crear mensaje
            message = MessageSchema(
                subject=subject,
                recipients=recipients,
                body=html_body,
                subtype=MessageType.html
            )

            # Enviar email
            await self.fm.send_message(message)

            logger.info(
                f"Email sent successfully",
                extra={
                    "to": recipients,
                    "subject": subject,
                    "from": conf.MAIL_FROM
                }
            )

            return True

        except Exception as e:
            logger.error(
                f"Failed to send email: {str(e)}",
                extra={
                    "to": to if isinstance(to, str) else ", ".join(to),
                    "subject": subject,
                    "error": str(e)
                },
                exc_info=True
            )
            return False

    async def send_template_email(
        self,
        to: EmailStr | List[EmailStr],
        subject: str,
        template_name: str,
        template_vars: Dict[str, Any]
    ) -> bool:
        """
        Envía un email usando una plantilla HTML.

        Args:
            to: Email(s) del destinatario
            subject: Asunto del email
            template_name: Nombre del archivo de plantilla (sin path)
            template_vars: Variables para reemplazar en la plantilla

        Returns:
            True si el email se envió correctamente, False en caso de error
        """
        try:
            # Leer plantilla
            template_path = os.path.join(
                os.path.dirname(__file__),
                "..",
                "templates",
                "emails",
                template_name
            )

            with open(template_path, 'r', encoding='utf-8') as f:
                html_template = f.read()

            # Reemplazar variables en plantilla
            html_body = html_template
            for key, value in template_vars.items():
                placeholder = f"{{{{{key}}}}}"
                html_body = html_body.replace(placeholder, str(value))

            # Enviar email
            return await self.send_email(
                to=to,
                subject=subject,
                html_body=html_body
            )

        except FileNotFoundError:
            logger.error(
                f"Email template not found: {template_name}",
                extra={"template": template_name}
            )
            return False

        except Exception as e:
            logger.error(
                f"Failed to send template email: {str(e)}",
                extra={
                    "template": template_name,
                    "error": str(e)
                },
                exc_info=True
            )
            return False


# Instancia global del cliente
email_client = EmailClient()
