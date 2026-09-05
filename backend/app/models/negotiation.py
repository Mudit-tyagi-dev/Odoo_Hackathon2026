from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.enums import SenderType

if TYPE_CHECKING:
    from .quotation import Quotation


class NegotiationMessage(Base):
    __tablename__ = "negotiation_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False, index=True)
    sender_type: Mapped[SenderType] = mapped_column(SAEnum(SenderType, name="sender_type"), nullable=False)
    message: Mapped[str] = mapped_column(String(2000), nullable=False)
    proposed_discount_pct: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    quotation: Mapped["Quotation"] = relationship(back_populates="negotiation_messages")
