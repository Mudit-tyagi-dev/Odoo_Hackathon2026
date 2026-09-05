from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.settings import settings
from app.core.db import get_db

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.get("/login")
async def login():
    pass

@auth_router.get("/signup")
async def signup():
    pass