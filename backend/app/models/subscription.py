from __future__ import annotations

from typing import List, TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.enums import BillingCycle

if TYPE_CHECKING:
    from .product import Product
    from .quotation import QuotationLine


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    billing_cycle: Mapped[BillingCycle] = mapped_column(
        SAEnum(BillingCycle, name="billing_cycle"), nullable=False
    )

    product: Mapped["Product"] = relationship(back_populates="subscription_plans")
    quotation_lines: Mapped[List["QuotationLine"]] = relationship(back_populates="subscription_plan")
