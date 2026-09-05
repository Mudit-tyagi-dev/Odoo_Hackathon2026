from __future__ import annotations

from typing import List, TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, TimestampMixin
from app.core.enums import UserRole

if TYPE_CHECKING:
    from app.models.approval import Approval
    from app.models.audit import QuotationAuditLog
    from app.models.customer import Customer
    from app.models.quotation import Quotation


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role"), nullable=False, index=True, default= "customer")

    # relationships
    quotations_as_rep: Mapped[List["Quotation"]] = relationship(
        back_populates="sales_rep", foreign_keys="Quotation.sales_rep_id"
    )
    approvals_acted: Mapped[List["Approval"]] = relationship(back_populates="approver")
    portal_customer: Mapped["Customer | None"] = relationship(back_populates="portal_user", uselist=False)
    audit_entries: Mapped[List["QuotationAuditLog"]] = relationship(back_populates="actor")