from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.enums import UserRole
from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.models.users import User
from app.schemas.auth import LoginRequest, SignupRequest, SignupResponse, UserResponse, LoginResponse

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Sign up a new user with email and password."""
    # Check if user already exists
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Hash password with bcrypt (includes salt)
    hashed_pw = hash_password(payload.password)

    # Default name to "Guest" if omitted/empty, default role to Customer
    user_name = payload.name if payload.name is not None else "Guest"
    user_role = UserRole.CUSTOMER

    new_user = User(
        email=payload.email,
        password_hash=hashed_pw,
        name=user_name,
        role=user_role,
        phone= payload.phone
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Issue JWT token
    token_payload = {
        "sub": str(new_user.id),
        "email": new_user.email,
        "role": new_user.role.value,
    }
    access_token = create_access_token(token_payload)

    return UserResponse.model_validate(new_user),


@auth_router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Log in user with email and password."""
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    }
    access_token = create_access_token(token_payload)

    return LoginResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@auth_router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Get profile of current logged-in user."""
    return UserResponse.model_validate(current_user)