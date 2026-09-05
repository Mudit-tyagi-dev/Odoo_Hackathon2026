from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, DateTime, Enum as SAEnum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.enums import BillingStatus, InvoiceStatus

if TYPE_CHECKING:
    from .quotation import Quotation, QuotationLine


class BillingSchedule(Base):
    """One row per scheduled bill for a line — one-time lines get a single row, subscriptions get one per cycle."""

    __tablename__ = "billing_schedule"

    id: Mapped[int] = mapped_column(primary_key=True)
    quotation_line_id: Mapped[int] = mapped_column(ForeignKey("quotation_lines.id"), nullable=False, index=True)
    billing_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[BillingStatus] = mapped_column(
        SAEnum(BillingStatus, name="billing_status"), nullable=False, default=BillingStatus.PENDING, index=True
    )

    __table_args__ = (CheckConstraint("amount >= 0", name="ck_billing_schedule_amount_non_negative"),)

    quotation_line: Mapped["QuotationLine"] = relationship(back_populates="billing_entries")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False, unique=True, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(
        SAEnum(InvoiceStatus, name="invoice_status"), nullable=False, default=InvoiceStatus.PENDING, index=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (CheckConstraint("amount >= 0", name="ck_invoices_amount_non_negative"),)

    quotation: Mapped["Quotation"] = relationship(back_populates="invoice")
