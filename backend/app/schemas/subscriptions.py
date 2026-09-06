# app/schemas/subscription.py

from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.core.enums import BillingCycle


class ProductSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    base_price: Decimal
    product_type: str


class SubscriptionPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    billing_cycle: BillingCycle
    product: ProductSummary