# app/schemas/quotations.py

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import LineType, QuotationStatus


class QuotationLineCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    discount_pct: Decimal = Field(default=0, ge=0, le=1)
    line_type: LineType
    subscription_plan_id: int | None = None


class QuotationCreate(BaseModel):
    customer_id: int | None = None
    lines: list[QuotationLineCreate] = Field(min_length=1)


class QuotationLineResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    discount_pct: Decimal
    line_type: LineType
    subscription_plan_id: int | None

    model_config = ConfigDict(from_attributes=True)


class QuotationResponse(BaseModel):
    id: int
    customer_id: int
    sales_rep_id: int | None
    status: QuotationStatus
    blended_risk_score: Decimal
    created_at: datetime
    updated_at: datetime
    lines: list[QuotationLineResponse]

    model_config = ConfigDict(from_attributes=True)


class QuotationUpdate(BaseModel):
    lines: list[QuotationLineCreate] = Field(min_length=1)
