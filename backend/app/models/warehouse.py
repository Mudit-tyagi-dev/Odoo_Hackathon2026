from __future__ import annotations

from typing import List, TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from .fulfillment import FulfillmentSplit
    from .product import Product


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(String(1000), nullable= False, default="Gandhinagar, Gujarat")
    max_q: Mapped[int] = mapped_column(Integer, nullable= False, default=500)

    stock_entries: Mapped[List["WarehouseStock"]] = relationship(back_populates="warehouse")
    fulfillment_splits: Mapped[List["FulfillmentSplit"]] = relationship(back_populates="warehouse")


class WarehouseStock(Base):
    __tablename__ = "warehouse_stock"

    warehouse_id: Mapped[int] = mapped_column(
        ForeignKey("warehouses.id", ondelete="CASCADE"),
        primary_key=True,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("warehouse_id", "product_id", name="uq_warehouse_stock_warehouse_product"),
        CheckConstraint("quantity >= 0", name="ck_warehouse_stock_quantity_non_negative"),
    )

    warehouse: Mapped["Warehouse"] = relationship(back_populates="stock_entries")
    product: Mapped["Product"] = relationship(back_populates="stock_entries")