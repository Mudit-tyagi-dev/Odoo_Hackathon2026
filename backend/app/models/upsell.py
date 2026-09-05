from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from .product import Product


class UpsellRule(Base):
    __tablename__ = "upsell_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    base_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    suggested_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    min_margin_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("base_product_id", "suggested_product_id", name="uq_upsell_rules_pair"),
        CheckConstraint("base_product_id != suggested_product_id", name="ck_upsell_rules_distinct_products"),
    )

    base_product: Mapped["Product"] = relationship(
        back_populates="upsell_as_base", foreign_keys=[base_product_id]
    )
    suggested_product: Mapped["Product"] = relationship(
        back_populates="upsell_as_suggested", foreign_keys=[suggested_product_id]
    )
