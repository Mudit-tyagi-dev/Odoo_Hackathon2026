import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SALES_REP = "sales_rep"
    SALES_MANAGER = "sales_manager"
    FINANCE = "finance"


class ProductType(str, enum.Enum):
    HARDWARE = "hardware"
    SERVICE = "service"
    SUBSCRIPTION = "subscription"


class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class QuotationStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEGOTIATING = "negotiating"
    CONFIRMED = "confirmed"


class LineType(str, enum.Enum):
    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"


class ApprovalLevel(str, enum.Enum):
    MANAGER = "manager"
    FINANCE = "finance"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RETURNED = "returned"


class FulfillmentStatus(str, enum.Enum):
    PENDING = "pending"
    SHIPPED = "shipped"
    BACKORDER = "backorder"


class BillingStatus(str, enum.Enum):
    PENDING = "pending"
    BILLED = "billed"


class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"


class SenderType(str, enum.Enum):
    CUSTOMER = "customer"
    REP = "rep"


class ActorRole(str, enum.Enum):
    CUSTOMER = "customer"
    REP = "rep"
    MANAGER = "manager"
    FINANCE = "finance"
    SYSTEM = "system"