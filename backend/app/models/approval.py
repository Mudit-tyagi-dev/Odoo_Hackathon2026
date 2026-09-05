from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.enums import ApprovalLevel, ApprovalStatus

if TYPE_CHECKING:
    from .quotation import Quotation
    from .users import User


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[int] = mapped_column(primary_key=True)
    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False, index=True)
    approver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    level: Mapped[ApprovalLevel] = mapped_column(SAEnum(ApprovalLevel, name="approval_level"), nullable=False)
    status: Mapped[ApprovalStatus] = mapped_column(
        SAEnum(ApprovalStatus, name="approval_status"),
        nullable=False,
        default=ApprovalStatus.PENDING,
        index=True,
    )
    reason: Mapped[str | None] = mapped_column(String(500))
    acted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    quotation: Mapped["Quotation"] = relationship(back_populates="approvals")
    approver: Mapped["User"] = relationship(back_populates="approvals_acted")
