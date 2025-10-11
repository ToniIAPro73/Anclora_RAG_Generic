from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    ADMIN = "admin"
    VIEWER = "viewer"


class UserBase(BaseModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserPublic(UserBase):
    pass


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
