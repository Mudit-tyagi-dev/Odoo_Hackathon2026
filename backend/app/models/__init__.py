"""
Import every model here so Base.metadata sees the full schema — required for
Alembic autogenerate and for `Base.metadata.create_all()` to create all tables.
"""

from app.core.db import Base
from .users import User
from .customer import  Customer # CustomerTier
from .product import Category, Product, DiscountRule
from .warehouse import Warehouse, WarehouseStock
from .subscription import SubscriptionPlan
from .quotation import Quotation, QuotationLine
from .approval import Approval
from .upsell import UpsellRule
from .fulfillment import FulfillmentSplit
from .billing import BillingSchedule, Invoice
from .negotiation import NegotiationMessage
from .audit import QuotationAuditLog

__all__ = [
    "Base",
    "User",
    # "CustomerTier",
    "Customer",
    "Category",
    "Product",
    "DiscountRule",
    "Warehouse",
    "WarehouseStock",
    "SubscriptionPlan",
    "Quotation",
    "QuotationLine",
    "Approval",
    "UpsellRule",
    "FulfillmentSplit",
    "BillingSchedule",
    "Invoice",
    "NegotiationMessage",
    "QuotationAuditLog",
]
