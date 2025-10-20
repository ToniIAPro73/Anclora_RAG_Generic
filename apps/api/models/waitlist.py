"""
Modelos Pydantic para el sistema de waitlist (T002)
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class WaitlistBase(BaseModel):
    """Modelo base para waitlist"""
    email: EmailStr
    referral_source: Optional[str] = None

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v: str) -> str:
        """Normaliza el email a minúsculas"""
        return v.lower().strip()

    @field_validator('referral_source')
    @classmethod
    def validate_referral_source(cls, v: Optional[str]) -> Optional[str]:
        """Valida que referral_source sea uno de los permitidos"""
        if v is None:
            return None

        allowed_sources = [
            'linkedin', 'twitter', 'direct', 'facebook',
            'google', 'github', 'referral', 'other'
        ]

        v_lower = v.lower().strip()
        if v_lower not in allowed_sources:
            return 'other'

        return v_lower


class WaitlistCreate(WaitlistBase):
    """Modelo para crear entrada en waitlist (request)"""
    pass


class WaitlistEntry(WaitlistBase):
    """Modelo completo de entrada en waitlist (response)"""
    id: UUID
    created_at: datetime
    invited: bool = False
    invited_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WaitlistResponse(BaseModel):
    """Respuesta exitosa al añadir a waitlist"""
    success: bool = True
    message: str
    position: Optional[int] = None


class WaitlistError(BaseModel):
    """Respuesta de error al añadir a waitlist"""
    success: bool = False
    error: str
    code: str


# Códigos de error estándar
class WaitlistErrorCode:
    INVALID_EMAIL = "INVALID_EMAIL"
    DUPLICATE_EMAIL = "DUPLICATE_EMAIL"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
