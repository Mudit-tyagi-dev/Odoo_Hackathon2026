from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.enums import LineType, QuotationStatus, UserRole
from app.models.product import Product
from app.models.quotation import Quotation, QuotationLine
from app.models.subscription import SubscriptionPlan
from app.models.users import User
from app.schemas.quotations import QuotationCreate, QuotationResponse
from app.core.security import get_current_user

from decimal import Decimal
from sqlalchemy import delete, func, select

from app.core.db import get_db
from app.core.enums import (
    ApprovalLevel,
    ApprovalStatus,
    LineType,
    QuotationStatus,
    UserRole,
)
from app.models.approval import Approval
from app.models.product import Product
from app.models.quotation import Quotation, QuotationLine
from app.models.subscription import SubscriptionPlan
from app.schemas.quotations import (
    QuotationResponse,
    QuotationUpdate,
)



quotation_router = APIRouter(
    prefix="/quotations",
    tags=["Quotations"],
)


@quotation_router.post(
    "",
    response_model=QuotationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_quotation(
    data: QuotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------
    # Determine customer and sales rep
    # -----------------------------------------

    if current_user.role == UserRole.CUSTOMER:
        # Customer creates quotation for themselves
        customer_id = current_user.id
        sales_rep_id = None

    elif current_user.role in {
        UserRole.SALES_REP,
        UserRole.SALES_MANAGER,
        UserRole.ADMIN,
    }:
        # Sales rep creates quotation for a customer
        if data.customer_id is None:
            raise HTTPException(
                status_code=400,
                detail="customer_id is required",
            )

        result = await db.execute(
            select(User).where(
                User.id == data.customer_id,
                User.role == UserRole.CUSTOMER,
            )
        )

        customer = result.scalar_one_or_none()

        if customer is None:
            raise HTTPException(
                status_code=404,
                detail="Customer not found",
            )

        customer_id = customer.id
        sales_rep_id = current_user.id

    else:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to create quotations",
        )

    # -----------------------------------------
    # Create quotation
    # -----------------------------------------

    quotation = Quotation(
        customer_id=customer_id,
        sales_rep_id=sales_rep_id,
        status=QuotationStatus.DRAFT,
        blended_risk_score=0,
    )

    db.add(quotation)

    # Get quotation.id before creating lines
    await db.flush()

    # -----------------------------------------
    # Create quotation lines
    # -----------------------------------------

    for line in data.lines:

        # Check product
        result = await db.execute(
            select(Product).where(
                Product.id == line.product_id
            )
        )

        product = result.scalar_one_or_none()

        if product is None:
            raise HTTPException(
                status_code=404,
                detail=f"Product {line.product_id} not found",
            )

        # -----------------------------------------
        # Subscription line validation
        # -----------------------------------------

        if line.line_type == LineType.SUBSCRIPTION:

            if line.subscription_plan_id is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "subscription_plan_id is required "
                        "for subscription lines"
                    ),
                )

            result = await db.execute(
                select(SubscriptionPlan).where(
                    SubscriptionPlan.id == line.subscription_plan_id,
                    SubscriptionPlan.product_id == line.product_id,
                )
            )

            plan = result.scalar_one_or_none()

            if plan is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Subscription plan does not exist "
                        "or does not belong to this product"
                    ),
                )

        else:
            if line.subscription_plan_id is not None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "subscription_plan_id is only allowed "
                        "for subscription lines"
                    ),
                )

        # -----------------------------------------
        # Add quotation line
        # -----------------------------------------

        db.add(
            QuotationLine(
                quotation_id=quotation.id,
                product_id=product.id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                discount_pct=line.discount_pct,
                line_type=line.line_type,
                subscription_plan_id=line.subscription_plan_id,
            )
        )

    # -----------------------------------------
    # Save everything
    # -----------------------------------------

    await db.commit()

    # -----------------------------------------
    # Reload quotation with lines
    # -----------------------------------------

    result = await db.execute(
        select(Quotation)
        .options(selectinload(Quotation.lines))
        .where(Quotation.id == quotation.id)
    )

    quotation = result.scalar_one()

    return quotation


@quotation_router.get(
    "",
    response_model=list[QuotationResponse],
)
async def get_quotations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=20, le=100),
):
    query = (
        select(Quotation)
        .options(
            selectinload(Quotation.lines)
        )
        .order_by(Quotation.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    # -----------------------------------------
    # Role-based filtering
    # -----------------------------------------

    if current_user.role == UserRole.CUSTOMER:
        # Customer sees only their own quotations
        query = query.where(
            Quotation.customer_id == current_user.id
        )

    elif current_user.role == UserRole.SALES_REP:
        # Sales rep sees only quotations assigned to them
        query = query.where(
            Quotation.sales_rep_id == current_user.id
        )

    elif current_user.role in {
        UserRole.SALES_MANAGER,
        UserRole.FINANCE,
        UserRole.ADMIN,
    }:
        # These roles can see all quotations
        pass

    else:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view quotations",
        )

    result = await db.execute(query)

    quotations = result.scalars().all()

    return quotations


@quotation_router.patch(
    "/{quotation_id}",
    response_model=QuotationResponse,
)
async def update_quotation(
    quotation_id: int,
    data: QuotationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation_id)
        .options(selectinload(Quotation.lines))
    )

    quotation = result.scalar_one_or_none()

    if quotation is None:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    # -----------------------------------------
    # CONFIRMED quotations are permanently locked
    # -----------------------------------------

    if quotation.status == QuotationStatus.CONFIRMED:
        raise HTTPException(
            status_code=400,
            detail="Confirmed quotations cannot be modified",
        )

    # -----------------------------------------
    # Permission checks
    # -----------------------------------------

    if current_user.role == UserRole.CUSTOMER:

        if quotation.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only modify your own quotations",
            )

    elif current_user.role == UserRole.SALES_REP:

        if quotation.sales_rep_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only modify quotations assigned to you",
            )

        if quotation.status == QuotationStatus.REJECTED:
            raise HTTPException(
                status_code=403,
                detail="Only the customer can modify a rejected quotation",
            )

    elif current_user.role == UserRole.ADMIN:
        pass

    else:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to modify quotations",
        )

    # -----------------------------------------
    # Approved quotation edited by customer
    # → invalidate approval
    # → negotiation
    # -----------------------------------------

    if (
        quotation.status == QuotationStatus.APPROVED
        and current_user.role == UserRole.CUSTOMER
    ):
        quotation.status = QuotationStatus.NEGOTIATING

        await db.execute(
            delete(Approval).where(
                Approval.quotation_id == quotation.id
            )
        )

    # -----------------------------------------
    # Any modification before approval
    # means we're negotiating again
    # -----------------------------------------

    elif quotation.status in {
        QuotationStatus.DRAFT,
        QuotationStatus.PENDING_APPROVAL,
        QuotationStatus.REJECTED,
    }:

        # Rejected can only be modified by customer
        if (
            quotation.status == QuotationStatus.REJECTED
            and current_user.role != UserRole.CUSTOMER
            and current_user.role != UserRole.ADMIN
        ):
            raise HTTPException(
                status_code=403,
                detail="Only the customer can modify a rejected quotation",
            )

        quotation.status = QuotationStatus.NEGOTIATING

    # -----------------------------------------
    # Delete existing lines
    # -----------------------------------------

    await db.execute(
        delete(QuotationLine).where(
            QuotationLine.quotation_id == quotation.id
        )
    )

    # -----------------------------------------
    # Add new lines
    # -----------------------------------------

    for line in data.lines:

        result = await db.execute(
            select(Product).where(
                Product.id == line.product_id
            )
        )

        product = result.scalar_one_or_none()

        if product is None:
            raise HTTPException(
                status_code=404,
                detail=f"Product {line.product_id} not found",
            )

        if line.line_type == LineType.SUBSCRIPTION:

            if line.subscription_plan_id is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "subscription_plan_id is required "
                        "for subscription lines"
                    ),
                )

            result = await db.execute(
                select(SubscriptionPlan).where(
                    SubscriptionPlan.id == line.subscription_plan_id,
                    SubscriptionPlan.product_id == line.product_id,
                )
            )

            plan = result.scalar_one_or_none()

            if plan is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Subscription plan does not exist "
                        "or does not belong to this product"
                    ),
                )

        elif line.subscription_plan_id is not None:

            raise HTTPException(
                status_code=400,
                detail=(
                    "subscription_plan_id is only allowed "
                    "for subscription lines"
                ),
            )

        db.add(
            QuotationLine(
                quotation_id=quotation.id,
                product_id=product.id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                discount_pct=line.discount_pct,
                line_type=line.line_type,
                subscription_plan_id=line.subscription_plan_id,
            )
        )

    await db.commit()

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation.id)
        .options(selectinload(Quotation.lines))
    )

    return result.scalar_one()


@quotation_router.post(
    "/{quotation_id}/submit",
    response_model=QuotationResponse,
)
async def submit_quotation(
    quotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation_id)
        .options(selectinload(Quotation.lines))
    )

    quotation = result.scalar_one_or_none()

    if quotation is None:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    if quotation.status not in {
        QuotationStatus.DRAFT,
        QuotationStatus.NEGOTIATING,
        QuotationStatus.REJECTED,
    }:
        raise HTTPException(
            status_code=400,
            detail="Quotation cannot be submitted in its current status",
        )

    # Customer can only submit their own quotation.
    if current_user.role == UserRole.CUSTOMER:

        if quotation.customer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only submit your own quotation",
            )

    # Sales rep must be assigned to quotation.
    elif current_user.role == UserRole.SALES_REP:

        if quotation.sales_rep_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only submit quotations assigned to you",
            )

    elif current_user.role == UserRole.ADMIN:
        pass

    else:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to submit quotations",
        )

    if not quotation.lines:
        raise HTTPException(
            status_code=400,
            detail="Quotation must contain at least one line",
        )

    # -----------------------------------------
    # Find highest discount
    # -----------------------------------------

    highest_discount = max(
        (line.discount_pct for line in quotation.lines),
        default=Decimal("0"),
    )

    # -----------------------------------------
    # 0% discount → automatically approved
    # -----------------------------------------

    if highest_discount == Decimal("0"):
        quotation.status = QuotationStatus.APPROVED

    else:
        quotation.status = QuotationStatus.PENDING_APPROVAL

    await db.commit()

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation.id)
        .options(selectinload(Quotation.lines))
    )

    return result.scalar_one()


@quotation_router.post(
    "/{quotation_id}/approve",
    response_model=QuotationResponse,
)
async def approve_quotation(
    quotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation_id)
        .options(selectinload(Quotation.lines))
    )

    quotation = result.scalar_one_or_none()

    if quotation is None:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    if quotation.status != QuotationStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail="Quotation is not waiting for approval",
        )

    highest_discount = max(
        (line.discount_pct for line in quotation.lines),
        default=Decimal("0"),
    )

    # -----------------------------------------
    # Determine required authority
    # -----------------------------------------

    if highest_discount <= Decimal("0.05"):
        required_level = "sales_rep"

    elif highest_discount <= Decimal("0.10"):
        required_level = "manager"

    elif highest_discount <= Decimal("0.15"):
        required_level = "finance"

    else:
        required_level = "admin"

    # -----------------------------------------
    # Permission validation
    # -----------------------------------------

    if required_level == "sales_rep":

        if current_user.role != UserRole.SALES_REP:
            if current_user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=403,
                    detail="Sales representative approval required",
                )

        # Rep cannot approve their own quotation.
        if (
            current_user.role == UserRole.SALES_REP
            and quotation.sales_rep_id == current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="You cannot approve your own quotation",
            )

    elif required_level == "manager":

        if current_user.role not in {
            UserRole.SALES_MANAGER,
            UserRole.ADMIN,
        }:
            raise HTTPException(
                status_code=403,
                detail="Sales manager approval required",
            )

    elif required_level == "finance":

        if current_user.role not in {
            UserRole.FINANCE,
            UserRole.ADMIN,
        }:
            raise HTTPException(
                status_code=403,
                detail="Finance approval required",
            )

    elif required_level == "admin":

        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Admin approval required",
            )

    # -----------------------------------------
    # Prevent duplicate approval
    # -----------------------------------------

    existing = await db.execute(
        select(Approval).where(
            Approval.quotation_id == quotation.id,
            Approval.approver_id == current_user.id,
            Approval.status == ApprovalStatus.APPROVED,
        )
    )

    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=400,
            detail="You have already approved this quotation",
        )

    # -----------------------------------------
    # Create approval record
    # -----------------------------------------

    if required_level == "manager":
        approval_level = ApprovalLevel.MANAGER

    elif required_level == "finance":
        approval_level = ApprovalLevel.FINANCE

    else:
        # Current ApprovalLevel enum has no SALES_REP/ADMIN.
        # Approval record is not required for these levels.
        approval_level = None

    if approval_level is not None:
        db.add(
            Approval(
                quotation_id=quotation.id,
                approver_id=current_user.id,
                level=approval_level,
                status=ApprovalStatus.APPROVED,
                acted_at=func.now(),
            )
        )

    quotation.status = QuotationStatus.APPROVED

    await db.commit()

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation.id)
        .options(selectinload(Quotation.lines))
    )

    return result.scalar_one()

@quotation_router.post(
    "/{quotation_id}/reject",
    response_model=QuotationResponse,
)
async def reject_quotation(
    quotation_id: int,
    reason: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation_id)
        .options(selectinload(Quotation.lines))
    )

    quotation = result.scalar_one_or_none()

    if quotation is None:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    if quotation.status != QuotationStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail="Only pending quotations can be rejected",
        )

    highest_discount = max(
        (line.discount_pct for line in quotation.lines),
        default=Decimal("0"),
    )

    # Determine authority
    if highest_discount <= Decimal("0.05"):

        if current_user.role != UserRole.ADMIN:

            if current_user.role != UserRole.SALES_REP:
                raise HTTPException(
                    status_code=403,
                    detail="Sales representative approval required",
                )

            if quotation.sales_rep_id == current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You cannot reject your own quotation",
                )

    elif highest_discount <= Decimal("0.10"):

        if current_user.role not in {
            UserRole.SALES_MANAGER,
            UserRole.ADMIN,
        }:
            raise HTTPException(
                status_code=403,
                detail="Sales manager approval required",
            )

    elif highest_discount <= Decimal("0.15"):

        if current_user.role not in {
            UserRole.FINANCE,
            UserRole.ADMIN,
        }:
            raise HTTPException(
                status_code=403,
                detail="Finance approval required",
            )

    else:

        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Admin approval required",
            )

    # Record manager/finance rejection
    if current_user.role in {
        UserRole.SALES_MANAGER,
        UserRole.FINANCE,
    }:
        level = (
            ApprovalLevel.MANAGER
            if current_user.role == UserRole.SALES_MANAGER
            else ApprovalLevel.FINANCE
        )

        db.add(
            Approval(
                quotation_id=quotation.id,
                approver_id=current_user.id,
                level=level,
                status=ApprovalStatus.REJECTED,
                reason=reason,
                acted_at=func.now(),
            )
        )

    quotation.status = QuotationStatus.REJECTED

    await db.commit()

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation.id)
        .options(selectinload(Quotation.lines))
    )

    return result.scalar_one()

@quotation_router.post(
    "/{quotation_id}/confirm",
    response_model=QuotationResponse,
)
async def confirm_quotation(
    quotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation_id)
        .options(selectinload(Quotation.lines))
    )

    quotation = result.scalar_one_or_none()

    if quotation is None:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=403,
            detail="Only the customer can confirm a quotation",
        )

    if quotation.customer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only confirm your own quotation",
        )

    if quotation.status != QuotationStatus.APPROVED:
        raise HTTPException(
            status_code=400,
            detail="Only approved quotations can be confirmed",
        )

    quotation.status = QuotationStatus.CONFIRMED

    await db.commit()

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation.id)
        .options(selectinload(Quotation.lines))
    )

    return result.scalar_one()

@quotation_router.post(
    "/{quotation_id}/self-assign",
    response_model=QuotationResponse,
)
async def assign_quotation(
    quotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(
            status_code=403,
            detail="Only sales representatives can claim quotations",
        )

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation_id)
    )

    quotation = result.scalar_one_or_none()

    if quotation is None:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found",
        )

    if quotation.status != QuotationStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail="Only draft quotations can be claimed",
        )

    if quotation.sales_rep_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Quotation is already assigned to a sales representative",
        )

    quotation.sales_rep_id = current_user.id

    await db.commit()

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation.id)
        .options(selectinload(Quotation.lines))
    )

    return result.scalar_one()
