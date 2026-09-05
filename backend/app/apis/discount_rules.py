from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from sqlalchemy import select

from app.models import DiscountRule

discount_router = APIRouter(prefix="/discount-rules", tags=["Discount"])

@discount_router.get("/")
async def get_discount_rules(db: AsyncSession = Depends(get_db)):
    discount_rules = (await db.execute(select(DiscountRule))).scalars().all()
    return discount_rules