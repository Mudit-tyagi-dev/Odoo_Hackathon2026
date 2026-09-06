# app/services/subscription.py

from fastapi import HTTPException, Depends, APIRouter
from app.core.db import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.subscription import SubscriptionPlan
from app.schemas.subscriptions import SubscriptionPlanResponse


sub_router = APIRouter(prefix="/subscription-plans", tags=["Subscription Plans"])

@sub_router.get("", response_model=list[SubscriptionPlanResponse],
)
async def get_subscription_plans(
    db: AsyncSession = Depends(get_db),
) -> list[SubscriptionPlan]:

    result = await db.execute(
        select(SubscriptionPlan)
        .options(selectinload(SubscriptionPlan.product))
        .order_by(SubscriptionPlan.id)
    )

    return list(result.scalars().all())


async def get_subscription_plan(
    db: AsyncSession,
    plan_id: int,
) -> SubscriptionPlan:

    result = await db.execute(
        select(SubscriptionPlan)
        .options(selectinload(SubscriptionPlan.product))
        .where(SubscriptionPlan.id == plan_id)
    )

    plan = result.scalar_one_or_none()

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription plan not found",
        )

    return plan


@sub_router.get("/{plan_id}", response_model=SubscriptionPlanResponse)
async def get_subscription_plan(
    plan_id: int,
    db: AsyncSession =  Depends(get_db),
) -> SubscriptionPlan:

    result = await db.execute(
        select(SubscriptionPlan)
        .options(selectinload(SubscriptionPlan.product))
        .where(SubscriptionPlan.id == plan_id)
    )

    plan = result.scalar_one_or_none()

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription plan not found",
        )

    return plan