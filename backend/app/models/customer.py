from __future__ import annotations

from decimal import Decimal
from typing import List, TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.product import DiscountRule
    from app.models.quotation import Quotation
    from app.models.users import User


# class CustomerTier(Base):
#     __tablename__ = "customer_tiers"

#     id: Mapped[int] = mapped_column(primary_key=True)
#     name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
#     default_discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)

#     customers: Mapped[List["Customer"]] = relationship(back_populates="tier")
#     discount_rules: Mapped[List["DiscountRule"]] = relationship(back_populates="tier")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    tier_id: Mapped[int] = mapped_column(ForeignKey("customer_tiers.id"), nullable=False, index=True)
    # nullable + unique: a customer *may* have portal login credentials, but if they do, it's 1:1
    portal_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), unique=True)

    # tier: Mapped["CustomerTier"] = relationship(back_populates="customers")
    portal_user: Mapped["User | None"] = relationship(back_populates="portal_customer")
    quotations: Mapped[List["Quotation"]] = relationship(back_populates="customer")