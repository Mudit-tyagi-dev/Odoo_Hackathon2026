from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.core.db import get_db
from app.core.settings import settings
import hashlib
import hmac
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
# from models import Users

def create_access_token(data: dict) -> str:
    """
    Generates a signed JWT access token containing the given data payload. (Must send "u_id" of type uuid)
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.JWT_EXPIRY_DAYS)
        
    to_encode.update({
        "exp": expire,
        "iat": now
    })
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """
    Decodes and verifies a JWT access token. Returns decoded claims or None if invalid.
    """
    print("decoding jwt...")
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        print("JWT decoded:", payload)
        return payload
    except JWTError as e:
        print("JWT ERROR:", repr(e))
        return None


security_scheme = HTTPBearer(auto_error=False)

async def auth_protect(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    FastAPI dependency to extract and validate the JWT Bearer token, then fetch current user from database.
    """
    print("auth protect called...")
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload or "u_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("u_id")
    try:
        user_uuid = UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token",
        )
        
    # user = await db.get(Users, user_uuid)
    # if not user:
    #     raise HTTPException(
    #         status_code=status.HTTP_404_NOT_FOUND,
    #         detail="User not found",
    #     )
        
    # return user