import os
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from models.user import UserPublic, UserRole
from services.auth_service import AuthService
from services.security import decode_token, TokenDecodeError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/sign-in", auto_error=False)
BYPASS_AUTH = os.getenv("AUTH_BYPASS", "true").lower() in {"1", "true", "yes"}


def _dev_user() -> UserPublic:
    now = datetime.utcnow()
    return UserPublic(
        id=uuid4(),
        email="dev@anclora.local",
        first_name="Anclora",
        last_name="Dev",
        role=UserRole.ADMIN,
        is_active=True,
        created_at=now,
        updated_at=now,
    )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPublic:
    if BYPASS_AUTH:
        return _dev_user()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = AuthService.get_user(UUID(user_id))
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except TokenDecodeError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def require_active_user(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return current_user


def require_admin(current_user: UserPublic = Depends(require_active_user)) -> UserPublic:
    if BYPASS_AUTH:
        return current_user
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user


def require_viewer_or_admin(current_user: UserPublic = Depends(require_active_user)) -> UserPublic:
    if BYPASS_AUTH:
        return current_user
    if current_user.role not in {UserRole.ADMIN, UserRole.VIEWER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")
    return current_user
