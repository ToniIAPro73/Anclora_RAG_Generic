from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from apps.api.models.user import UserPublic, UserRole
from apps.api.services.auth_service import AuthService
from apps.api.services.security import decode_token, TokenDecodeError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/sign-in", auto_error=False)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPublic:
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
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user


def require_viewer_or_admin(current_user: UserPublic = Depends(require_active_user)) -> UserPublic:
    if current_user.role not in {UserRole.ADMIN, UserRole.VIEWER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")
    return current_user
