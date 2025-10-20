"""
Repository para operaciones de base de datos de waitlist (T002)
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from apps.api.database.postgres_client import get_db_session
from apps.api.models.waitlist import WaitlistCreate, WaitlistEntry


class WaitlistRepository:
    """Repository para gestionar la tabla waitlist"""

    def __init__(self):
        self.session = get_db_session()

    def add_to_waitlist(self, waitlist_data: WaitlistCreate) -> WaitlistEntry:
        """
        Añade un email a la waitlist.

        Args:
            waitlist_data: Datos del waitlist entry

        Returns:
            WaitlistEntry creado

        Raises:
            IntegrityError: Si el email ya existe
        """
        query = text("""
            INSERT INTO waitlist (email, referral_source)
            VALUES (:email, :referral_source)
            RETURNING id, email, referral_source, created_at, invited, invited_at
        """)

        try:
            result = self.session.execute(
                query,
                {
                    "email": waitlist_data.email,
                    "referral_source": waitlist_data.referral_source
                }
            )
            self.session.commit()

            row = result.fetchone()
            return WaitlistEntry(
                id=row[0],
                email=row[1],
                referral_source=row[2],
                created_at=row[3],
                invited=row[4],
                invited_at=row[5]
            )

        except IntegrityError as e:
            self.session.rollback()
            raise e

    def get_by_email(self, email: str) -> Optional[WaitlistEntry]:
        """
        Busca una entrada por email.

        Args:
            email: Email a buscar

        Returns:
            WaitlistEntry si existe, None si no
        """
        query = text("""
            SELECT id, email, referral_source, created_at, invited, invited_at
            FROM waitlist
            WHERE email = :email
        """)

        result = self.session.execute(query, {"email": email.lower()})
        row = result.fetchone()

        if row:
            return WaitlistEntry(
                id=row[0],
                email=row[1],
                referral_source=row[2],
                created_at=row[3],
                invited=row[4],
                invited_at=row[5]
            )

        return None

    def email_exists(self, email: str) -> bool:
        """
        Verifica si un email ya está en la waitlist.

        Args:
            email: Email a verificar

        Returns:
            True si existe, False si no
        """
        query = text("""
            SELECT COUNT(*) FROM waitlist WHERE email = :email
        """)

        result = self.session.execute(query, {"email": email.lower()})
        count = result.scalar()

        return count > 0

    def get_position(self, email: str) -> Optional[int]:
        """
        Obtiene la posición de un email en la waitlist (ordenado por created_at).

        Args:
            email: Email a buscar

        Returns:
            Posición (1-indexed) o None si no existe
        """
        query = text("""
            SELECT position FROM (
                SELECT email, ROW_NUMBER() OVER (ORDER BY created_at) as position
                FROM waitlist
                WHERE invited = FALSE
            ) subquery
            WHERE email = :email
        """)

        result = self.session.execute(query, {"email": email.lower()})
        row = result.fetchone()

        return row[0] if row else None

    def get_waitlist_count(self) -> int:
        """
        Obtiene el total de emails en la waitlist no invitados.

        Returns:
            Número total de emails pending
        """
        query = text("""
            SELECT COUNT(*) FROM waitlist WHERE invited = FALSE
        """)

        result = self.session.execute(query)
        return result.scalar()

    def mark_as_invited(self, email: str) -> bool:
        """
        Marca un email como invitado.

        Args:
            email: Email a marcar

        Returns:
            True si se actualizó, False si no existe
        """
        query = text("""
            UPDATE waitlist
            SET invited = TRUE, invited_at = NOW()
            WHERE email = :email AND invited = FALSE
        """)

        result = self.session.execute(query, {"email": email.lower()})
        self.session.commit()

        return result.rowcount > 0

    def get_pending_invites(self, limit: int = 50) -> list[WaitlistEntry]:
        """
        Obtiene emails pendientes de invitación (ordenados por fecha de registro).

        Args:
            limit: Número máximo de resultados

        Returns:
            Lista de WaitlistEntry pendientes
        """
        query = text("""
            SELECT id, email, referral_source, created_at, invited, invited_at
            FROM waitlist
            WHERE invited = FALSE
            ORDER BY created_at ASC
            LIMIT :limit
        """)

        result = self.session.execute(query, {"limit": limit})

        entries = []
        for row in result:
            entries.append(WaitlistEntry(
                id=row[0],
                email=row[1],
                referral_source=row[2],
                created_at=row[3],
                invited=row[4],
                invited_at=row[5]
            ))

        return entries

    def close(self):
        """Cierra la sesión de base de datos"""
        self.session.close()
