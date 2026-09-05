from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.enums import ActorRole

if TYPE_CHECKING:
    from .quotation import Quotation
    from .users import User


class QuotationAuditLog(Base):
    """Append-only trail of every action on a quotation — discount edits, status changes,
    approvals, customer counter-offers. Separate from NegotiationMessage, which holds the
    actual portal conversation text; this is the compliance/audit record."""

    __tablename__ = "quotation_audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False, index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    actor_role: Mapped[ActorRole] = mapped_column(SAEnum(ActorRole, name="actor_role"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str | None] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_quotation_audit_log_quotation_created", "quotation_id", "created_at"),
    )

    quotation: Mapped["Quotation"] = relationship(back_populates="audit_log")
    actor: Mapped["User | None"] = relationship(back_populates="audit_entries")
