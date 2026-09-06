# from __future__ import annotations

# from datetime import datetime
# from decimal import Decimal
# from typing import List, TYPE_CHECKING

# from sqlalchemy import CheckConstraint, DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, func
# from sqlalchemy.orm import Mapped, mapped_column, relationship

# from app.core.db import Base
# from app.core.enums import LineType, QuotationStatus

# if TYPE_CHECKING:
#     from .approval import Approval
#     from .audit import QuotationAuditLog
#     from .billing import BillingSchedule, Invoice
#     from .customer import Customer
#     from .fulfillment import FulfillmentSplit
#     from .negotiation import NegotiationMessage
#     from .product import Product
#     from .subscription import SubscriptionPlan
#     from .users import User


# class Quotation(Base):
#     __tablename__ = "quotations"

#     id: Mapped[int] = mapped_column(primary_key=True)
#     customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)
#     sales_rep_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
#     status: Mapped[QuotationStatus] = mapped_column(
#         SAEnum(QuotationStatus, name="quotation_status"),
#         nullable=False,
#         default=QuotationStatus.DRAFT,
#         index=True,
#     )
#     blended_risk_score: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, default=0)
#     created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

#     # relationships
#     customer: Mapped["Customer"] = relationship(back_populates="quotations")
#     sales_rep: Mapped["User"] = relationship(back_populates="quotations_as_rep", foreign_keys=[sales_rep_id])
#     lines: Mapped[List["QuotationLine"]] = relationship(back_populates="quotation", cascade="all, delete-orphan")
#     approvals: Mapped[List["Approval"]] = relationship(back_populates="quotation", cascade="all, delete-orphan")
#     fulfillment_splits: Mapped[List["FulfillmentSplit"]] = relationship(
#         back_populates="quotation", cascade="all, delete-orphan"
#     )
#     negotiation_messages: Mapped[List["NegotiationMessage"]] = relationship(
#         back_populates="quotation", cascade="all, delete-orphan"
#     )
#     audit_log: Mapped[List["QuotationAuditLog"]] = relationship(
#         back_populates="quotation", cascade="all, delete-orphan"
#     )
#     invoice: Mapped["Invoice | None"] = relationship(
#         back_populates="quotation", uselist=False, cascade="all, delete-orphan"
#     )


# class QuotationLine(Base):
#     __tablename__ = "quotation_lines"

#     id: Mapped[int] = mapped_column(primary_key=True)
#     quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False, index=True)
#     product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
#     quantity: Mapped[int] = mapped_column(Integer, nullable=False)
#     unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
#     discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
#     line_type: Mapped[LineType] = mapped_column(SAEnum(LineType, name="line_type"), nullable=False)
#     # only set when line_type == SUBSCRIPTION
#     subscription_plan_id: Mapped[int | None] = mapped_column(ForeignKey("subscription_plans.id"), index=True)

#     __table_args__ = (
#         CheckConstraint("quantity > 0", name="ck_quotation_lines_quantity_positive"),
#         CheckConstraint("discount_pct >= 0 AND discount_pct <= 100", name="ck_quotation_lines_discount_range"),
#     )

#     quotation: Mapped["Quotation"] = relationship(back_populates="lines")
#     product: Mapped["Product"] = relationship(back_populates="quotation_lines")
#     subscription_plan: Mapped["SubscriptionPlan | None"] = relationship(back_populates="quotation_lines")
#     billing_entries: Mapped[List["BillingSchedule"]] = relationship(
#         back_populates="quotation_line", cascade="all, delete-orphan"
#     )

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.enums import LineType, QuotationStatus

if TYPE_CHECKING:
    from .approval import Approval
    from .audit import QuotationAuditLog
    from .billing import BillingSchedule, Invoice
    from .fulfillment import FulfillmentSplit
    from .negotiation import NegotiationMessage
    from .product import Product
    from .subscription import SubscriptionPlan
    from .users import User


class Quotation(Base):
    __tablename__ = "quotations"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Customer is now a User with role=CUSTOMER
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    sales_rep_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    status: Mapped[QuotationStatus] = mapped_column(
        SAEnum(QuotationStatus, name="quotation_status"),
        nullable=False,
        default=QuotationStatus.DRAFT,
        index=True,
    )

    blended_risk_score: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "blended_risk_score >= 0",
            name="ck_quotations_risk_score_non_negative",
        ),
        CheckConstraint(
            "blended_risk_score <= 100",
            name="ck_quotations_risk_score_max",
        ),
        CheckConstraint(
            "customer_id != sales_rep_id",
            name="ck_quotation_customer_not_sales_rep",
        ),
    )

    # Relationships

    customer: Mapped["User"] = relationship(
        foreign_keys=[customer_id],
        back_populates="quotations_as_customer",
    )

    sales_rep: Mapped["User"] = relationship(
        foreign_keys=[sales_rep_id],
        back_populates="quotations_as_rep",
    )

    lines: Mapped[List["QuotationLine"]] = relationship(
        back_populates="quotation",
        cascade="all, delete-orphan",
    )

    approvals: Mapped[List["Approval"]] = relationship(
        back_populates="quotation",
        cascade="all, delete-orphan",
    )

    fulfillment_splits: Mapped[List["FulfillmentSplit"]] = relationship(
        back_populates="quotation",
        cascade="all, delete-orphan",
    )

    negotiation_messages: Mapped[List["NegotiationMessage"]] = relationship(
        back_populates="quotation",
        cascade="all, delete-orphan",
    )

    audit_log: Mapped[List["QuotationAuditLog"]] = relationship(
        back_populates="quotation",
        cascade="all, delete-orphan",
    )

    invoice: Mapped["Invoice | None"] = relationship(
        back_populates="quotation",
        uselist=False,
        cascade="all, delete-orphan",
    )


class QuotationLine(Base):
    __tablename__ = "quotation_lines"

    id: Mapped[int] = mapped_column(primary_key=True)

    quotation_id: Mapped[int] = mapped_column(
        ForeignKey("quotations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Price before discount.
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    discount_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=0,
    )

    line_type: Mapped[LineType] = mapped_column(
        SAEnum(LineType, name="line_type"),
        nullable=False,
    )

    subscription_plan_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscription_plans.id"),
        nullable=True,
        index=True,
    )

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_quotation_lines_quantity_positive",
        ),
        CheckConstraint(
            "unit_price >= 0",
            name="ck_quotation_lines_unit_price_non_negative",
        ),
        CheckConstraint(
            "discount_pct >= 0 AND discount_pct <= 100",
            name="ck_quotation_lines_discount_range",
        ),

        # Subscription line MUST have a plan.
        # Non-subscription line MUST NOT have a plan.
        CheckConstraint(
            """
            (line_type = 'SUBSCRIPTION' AND subscription_plan_id IS NOT NULL)
            OR
            (line_type != 'SUBSCRIPTION' AND subscription_plan_id IS NULL)
            """,
            name="ck_quotation_lines_subscription_plan_consistency",
        ),
    )

    quotation: Mapped["Quotation"] = relationship(
        back_populates="lines",
    )

    product: Mapped["Product"] = relationship(
        back_populates="quotation_lines",
    )

    subscription_plan: Mapped["SubscriptionPlan | None"] = relationship(
        back_populates="quotation_lines",
    )

    billing_entries: Mapped[List["BillingSchedule"]] = relationship(
        back_populates="quotation_line",
        cascade="all, delete-orphan",
    )
