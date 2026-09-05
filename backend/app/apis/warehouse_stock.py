from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.models.product import Product
from app.models.warehouse import Warehouse, WarehouseStock
from app.schemas.warehouse import WarehouseStockCreate, WarehouseStockResponse

warehouse_stock_router = APIRouter(prefix="/warehouse-inventory", tags=["Warehouse Inventory"])


@warehouse_stock_router.post("", response_model=WarehouseStockResponse, status_code=status.HTTP_200_OK)
@warehouse_stock_router.post("/", response_model=WarehouseStockResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
async def upsert_warehouse_stock(
    payload: WarehouseStockCreate,
    db: AsyncSession = Depends(get_db),
):
    """Upsert stock quantity for a warehouse and product.

    If the primary key (warehouse_id, product_id) already exists, update its quantity.
    If it does not exist, insert a new warehouse_stock row.
    """
    # 1. Check if warehouse exists
    wh_stmt = select(Warehouse).where(Warehouse.id == payload.warehouse_id)
    wh_res = await db.execute(wh_stmt)
    warehouse = wh_res.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warehouse with ID {payload.warehouse_id} not found",
        )

    # 2. Check if product exists
    prod_stmt = select(Product).where(Product.id == payload.product_id)
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {payload.product_id} not found",
        )

    # 3. Check if composite primary key (warehouse_id, product_id) exists in WarehouseStock
    stmt = (
        select(WarehouseStock)
        .options(selectinload(WarehouseStock.warehouse), selectinload(WarehouseStock.product))
        .where(
            WarehouseStock.warehouse_id == payload.warehouse_id,
            WarehouseStock.product_id == payload.product_id,
        )
    )
    result = await db.execute(stmt)
    stock_entry = result.scalar_one_or_none()

    if stock_entry:
        # Row exists: update quantity only
        stock_entry.quantity = payload.quantity
    else:
        # Row does not exist: create new entry
        stock_entry = WarehouseStock(
            warehouse_id=payload.warehouse_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        )
        db.add(stock_entry)

    await db.commit()

    # Re-query with relationships loaded
    res_stmt = (
        select(WarehouseStock)
        .options(selectinload(WarehouseStock.warehouse), selectinload(WarehouseStock.product))
        .where(
            WarehouseStock.warehouse_id == payload.warehouse_id,
            WarehouseStock.product_id == payload.product_id,
        )
    )
    updated_res = await db.execute(res_stmt)
    stock_entry = updated_res.scalar_one()

    return WarehouseStockResponse(
        warehouse_id=stock_entry.warehouse_id,
        product_id=stock_entry.product_id,
        quantity=stock_entry.quantity,
        warehouse_name=stock_entry.warehouse.name if stock_entry.warehouse else None,
        product_name=stock_entry.product.name if stock_entry.product else None,
    )


@warehouse_stock_router.get("", response_model=List[WarehouseStockResponse])
@warehouse_stock_router.get("/", response_model=List[WarehouseStockResponse], include_in_schema=False)
async def list_warehouse_stocks(
    db: AsyncSession = Depends(get_db),
):
    """List all warehouse stock records."""
    stmt = select(WarehouseStock).options(
        selectinload(WarehouseStock.warehouse),
        selectinload(WarehouseStock.product),
    )
    result = await db.execute(stmt)
    stocks = result.scalars().all()

    return [
        WarehouseStockResponse(
            warehouse_id=s.warehouse_id,
            product_id=s.product_id,
            quantity=s.quantity,
            warehouse_name=s.warehouse.name if s.warehouse else None,
            product_name=s.product.name if s.product else None,
        )
        for s in stocks
    ]


@warehouse_stock_router.get("/{warehouse_id}/{product_id}", response_model=WarehouseStockResponse)
async def get_warehouse_stock(
    warehouse_id: int,
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific warehouse stock record by primary key."""
    stmt = (
        select(WarehouseStock)
        .options(selectinload(WarehouseStock.warehouse), selectinload(WarehouseStock.product))
        .where(
            WarehouseStock.warehouse_id == warehouse_id,
            WarehouseStock.product_id == product_id,
        )
    )
    result = await db.execute(stmt)
    stock_entry = result.scalar_one_or_none()

    if not stock_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock entry for warehouse {warehouse_id} and product {product_id} not found",
        )

    return WarehouseStockResponse(
        warehouse_id=stock_entry.warehouse_id,
        product_id=stock_entry.product_id,
        quantity=stock_entry.quantity,
        warehouse_name=stock_entry.warehouse.name if stock_entry.warehouse else None,
        product_name=stock_entry.product.name if stock_entry.product else None,
    )