from fastapi import APIRouter, HTTPException, Depends
from app.core.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession

user_router = APIRouter("/users", tags= ["Users"] )

# @user_router.get()