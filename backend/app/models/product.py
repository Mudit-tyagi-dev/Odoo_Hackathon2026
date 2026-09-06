from __future__ import annotations

from decimal import Decimal
from typing import List, TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Enum as SAEnum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.enums import ProductType

if TYPE_CHECKING:
    # from .customer import CustomerTier
    from .fulfillment import FulfillmentSplit
    from .quotation import QuotationLine
    from .subscription import SubscriptionPlan
    from .upsell import UpsellRule
    from .warehouse import WarehouseStock


class Category(Base):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    product_type: Mapped[ProductType] = mapped_column(
        SAEnum(ProductType, name="product_type"), nullable=False, index=True
    )

    __table_args__ = (
        CheckConstraint("base_price >= 0", name="ck_products_base_price_non_negative"),
        CheckConstraint("cost_price >= 0", name="ck_products_cost_price_non_negative"),
    )

    category: Mapped["Category"] = relationship(back_populates="products")
    stock_entries: Mapped[List["WarehouseStock"]] = relationship(back_populates="product")
    subscription_plans: Mapped[List["SubscriptionPlan"]] = relationship(back_populates="product")
    quotation_lines: Mapped[List["QuotationLine"]] = relationship(back_populates="product")
    fulfillment_splits: Mapped[List["FulfillmentSplit"]] = relationship(back_populates="product")
    upsell_as_base: Mapped[List["UpsellRule"]] = relationship(
        back_populates="base_product", foreign_keys="UpsellRule.base_product_id"
    )
    upsell_as_suggested: Mapped[List["UpsellRule"]] = relationship(
        back_populates="suggested_product", foreign_keys="UpsellRule.suggested_product_id"
    )


class DiscountRule(Base):
    """Per (product, tier) discount ceiling + which approval levels it triggers."""

    __tablename__ = "discount_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    max_discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    min_discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    requires_manager_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    requires_finance_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint("max_discount_pct >= 0 AND max_discount_pct <= 100", name="ck_discount_rules_pct_range"),
    )