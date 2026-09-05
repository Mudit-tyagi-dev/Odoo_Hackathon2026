from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.db import get_db
from app.core.enums import ProductType
from app.models.product import Category, Product
from app.schemas.product import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)

product_router = APIRouter(prefix="/products", tags=["Products"])


# ==========================================
# CATEGORY CRUD ENDPOINTS
# ==========================================

@product_router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new product category."""
    # Check duplicate category name
    stmt = select(Category).where(func.lower(Category.name) == payload.name.strip().lower())
    result = await db.execute(stmt)
    existing_cat = result.scalar_one_or_none()

    if existing_cat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with name '{payload.name}' already exists",
        )

    category = Category(name=payload.name.strip())
    db.add(category)
    await db.commit()
    await db.refresh(category)

    return CategoryResponse.model_validate(category)


@product_router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    """List all product categories."""
    stmt = select(Category).order_by(Category.name)
    result = await db.execute(stmt)
    categories = result.scalars().all()
    return {
        "total_cat": len(categories),
        "data":[CategoryResponse.model_validate(c) for c in categories]
        }


@product_router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single product category by ID."""
    stmt = select(Category).where(Category.id == category_id)
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found",
        )

    return CategoryResponse.model_validate(category)


# @product_router.put("/categories/{category_id}", response_model=CategoryResponse)
# async def update_category(
#     category_id: int,
#     payload: CategoryUpdate,
#     db: AsyncSession = Depends(get_db),
# ):
#     """Update a product category by ID."""
#     stmt = select(Category).where(Category.id == category_id)
#     result = await db.execute(stmt)
#     category = result.scalar_one_or_none()

#     if not category:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Category with ID {category_id} not found",
#         )

#     if payload.name is not None:
#         new_name = payload.name.strip()
#         # Check duplicate name
#         dup_stmt = select(Category).where(
#             func.lower(Category.name) == new_name.lower(),
#             Category.id != category_id,
#         )
#         dup_res = await db.execute(dup_stmt)
#         if dup_res.scalar_one_or_none():
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail=f"Category with name '{new_name}' already exists",
#             )
#         category.name = new_name

#     await db.commit()
#     await db.refresh(category)
#     return CategoryResponse.model_validate(category)
# @product_router.delete("/categories/{category_id}", status_code=status.HTTP_200_OK)
# async def delete_category(
#     category_id: int,
#     db: AsyncSession = Depends(get_db),
# ):
#     """Delete a product category by ID."""
#     stmt = select(Category).where(Category.id == category_id)
#     result = await db.execute(stmt)
#     category = result.scalar_one_or_none()

#     if not category:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Category with ID {category_id} not found",
#         )

#     # Check if category has associated products
#     prod_stmt = select(Product).where(Product.category_id == category_id)
#     prod_res = await db.execute(prod_stmt)
#     if prod_res.scalar_one_or_none():
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Cannot delete category that contains products. Reassign or delete the products first.",
#         )

#     await db.delete(category)
#     await db.commit()

#     return {"detail": f"Category with ID {category_id} deleted successfully"}


# ==========================================
# PRODUCT CRUD ENDPOINTS
# ==========================================

@product_router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new product."""
    # Verify category exists
    cat_stmt = select(Category).where(Category.id == payload.category_id)
    cat_res = await db.execute(cat_stmt)
    category = cat_res.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with ID {payload.category_id} does not exist",
        )

    product = Product(
        name=payload.name.strip(),
        category_id=payload.category_id,
        base_price=payload.base_price,
        cost_price=payload.cost_price,
        description=payload.description,
        product_type=payload.product_type,
    )

    db.add(product)
    await db.commit()

    # Query with joinedload for full category response
    res_stmt = select(Product).options(joinedload(Product.category)).where(Product.id == product.id)
    result = await db.execute(res_stmt)
    created_product = result.scalar_one()

    return ProductResponse.model_validate(created_product)


@product_router.get("", response_model=List[ProductResponse])
async def list_products(
    search: Optional[str] = Query(None, description="Search by product name (case-insensitive)"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    product_type: Optional[ProductType] = Query(None, description="Filter by product type"),
    skip: int = Query(0, ge=0, description="Offset / skip count"),
    limit: int = Query(20, ge=1, le=100, description="Pagination size limit (20 to 100)"),
    db: AsyncSession = Depends(get_db),
):
    """List all products with filtering and pagination."""
    stmt = select(Product).options(joinedload(Product.category))

    if search:
        stmt = stmt.where(Product.name.ilike(f"%{search.strip()}%"))

    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)

    if product_type is not None:
        stmt = stmt.where(Product.product_type == product_type)

    stmt = stmt.order_by(Product.id.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    products = result.scalars().all()

    return [ProductResponse.model_validate(p) for p in products]


@product_router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single product by ID."""
    stmt = select(Product).options(joinedload(Product.category)).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )

    return ProductResponse.model_validate(product)


@product_router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a product by ID."""
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )

    if payload.category_id is not None:
        cat_stmt = select(Category).where(Category.id == payload.category_id)
        cat_res = await db.execute(cat_stmt)
        if not cat_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID {payload.category_id} does not exist",
            )
        product.category_id = payload.category_id

    if payload.name is not None:
        product.name = payload.name.strip()
    if payload.base_price is not None:
        product.base_price = payload.base_price
    if payload.cost_price is not None:
        product.cost_price = payload.cost_price
    if payload.description is not None:
        product.description = payload.description
    if payload.product_type is not None:
        product.product_type = payload.product_type

    await db.commit()

    res_stmt = select(Product).options(joinedload(Product.category)).where(Product.id == product_id)
    updated_res = await db.execute(res_stmt)
    updated_product = updated_res.scalar_one()

    return ProductResponse.model_validate(updated_product)


@product_router.delete("/{product_id}", status_code=status.HTTP_200_OK)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a product by ID."""
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )

    await db.delete(product)
    await db.commit()

    return {"detail": f"Product with ID {product_id} deleted successfully"}
