import os
import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field

from deps import require_active_user
from models.user import TokenResponse, UserPublic, UserRole
from services.auth_service import AuthService

PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$")
ADMIN_REGISTRATION_KEY = os.getenv("ADMIN_REGISTRATION_KEY")

router = APIRouter(prefix="/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    role: UserRole = UserRole.VIEWER
    admin_key: Optional[str] = None


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class MeResponse(UserPublic):
    pass


def _validate_password(password: str) -> None:
    if not PASSWORD_REGEX.match(password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must contain at least 8 characters, including uppercase, lowercase, numbers and symbols.",
        )


@router.post("/sign-up", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def sign_up(payload: SignUpRequest):
    _validate_password(payload.password)
    role = payload.role

    if role == UserRole.ADMIN:
        admin_exists = AuthService.has_admin_user()
        if ADMIN_REGISTRATION_KEY:
            if payload.admin_key != ADMIN_REGISTRATION_KEY:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin registration key")
        elif admin_exists:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin registration key not configured")

    user = AuthService.create_user(
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=role,
    )
    token = AuthService.issue_token(user)
    return TokenResponse(access_token=token, user=user)


@router.post("/sign-in", response_model=TokenResponse)
async def sign_in(payload: SignInRequest):
    user = AuthService.authenticate(payload.email, payload.password)
    token = AuthService.issue_token(user)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: UserPublic = Depends(require_active_user)):
    return current_user
