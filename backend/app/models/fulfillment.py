from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum as SAEnum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.enums import FulfillmentStatus

if TYPE_CHECKING:
    from .product import Product
    from .quotation import Quotation
    from .warehouse import Warehouse


class FulfillmentSplit(Base):
    __tablename__ = "fulfillment_splits"

    id: Mapped[int] = mapped_column(primary_key=True)
    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False, index=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[FulfillmentStatus] = mapped_column(
        SAEnum(FulfillmentStatus, name="fulfillment_status"),
        nullable=False,
        default=FulfillmentStatus.PENDING,
        index=True,
    )

    __table_args__ = (CheckConstraint("quantity > 0", name="ck_fulfillment_splits_quantity_positive"),)

    quotation: Mapped["Quotation"] = relationship(back_populates="fulfillment_splits")
    warehouse: Mapped["Warehouse"] = relationship(back_populates="fulfillment_splits")
    product: Mapped["Product"] = relationship(back_populates="fulfillment_splits")
