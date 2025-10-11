from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import EmailStr

from database import user_repository
from models.user import UserPublic, UserRole
from services.security import hash_password, verify_password, create_access_token


def _to_public(record: dict) -> UserPublic:
    data = {
        "id": record["id"],
        "email": record["email"],
        "first_name": record["first_name"],
        "last_name": record["last_name"],
        "role": UserRole(record["role"]),
        "is_active": record.get("is_active", True),
        "created_at": record.get("created_at"),
        "updated_at": record.get("updated_at"),
    }
    return UserPublic(**data)


class AuthService:
    @staticmethod
    def has_admin_user() -> bool:
        return user_repository.has_admin_user()

    @staticmethod
    def create_user(*, email: EmailStr, password: str, first_name: str, last_name: str, role: UserRole) -> UserPublic:
        existing = user_repository.get_user_by_email(email.lower())
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        hashed = hash_password(password)
        record = user_repository.create_user(
            email=email.lower(),
            password_hash=hashed,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            role=role.value,
        )
        return _to_public(record)

    @staticmethod
    def authenticate(email: EmailStr, password: str) -> UserPublic:
        record = user_repository.get_user_by_email(email.lower())
        if not record or "password_hash" not in record or not verify_password(password, record["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not record.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive account")
        user = _to_public(record)
        user_repository.touch_user_login(user.id)
        return user

    @staticmethod
    def issue_token(user: UserPublic) -> str:
        payload = {"sub": str(user.id), "role": user.role.value}
        return create_access_token(payload)

    @staticmethod
    def get_user(user_id: UUID) -> Optional[UserPublic]:
        record = user_repository.get_user_by_id(user_id)
        if not record:
            return None
        return _to_public(record)
