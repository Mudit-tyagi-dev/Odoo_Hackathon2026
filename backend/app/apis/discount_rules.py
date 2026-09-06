from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User
from app.core.db import get_db
from app.core.security import get_current_user, authorize_customer
from sqlalchemy import select

from app.models import DiscountRule

discount_router = APIRouter(prefix="/discount-rules", tags=["Discount"])

@discount_router.get("/")
async def get_discount_rules(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    await authorize_customer(user)
    discount_rules = (await db.execute(select(DiscountRule))).scalars().all()
    return discount_rules