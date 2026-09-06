from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.models.warehouse import Warehouse, WarehouseStock
from app.schemas.warehouse import (
    WarehouseCreate,
    WarehouseUpdate,
    WarehouseProductStock,
    WarehouseResponse,
)

warehouse_router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

@warehouse_router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    payload: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new warehouse."""
    stmt = select(Warehouse).where(func.lower(Warehouse.name) == payload.name.strip().lower())
    result = await db.execute(stmt)
    existing_wh = result.scalar_one_or_none()

    if existing_wh:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Warehouse with name '{payload.name}' already exists",
        )

    warehouse = Warehouse(
        name=payload.name.strip(),
        address=payload.address.strip() if payload.address else "Gandhinagar, Gujarat",
        max_q=payload.max_q if payload.max_q is not None else 500,
    )

    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)

    return WarehouseResponse(
        id=warehouse.id,
        name=warehouse.name,
        address=warehouse.address,
        max_q=warehouse.max_q,
        products=[],
        total_quantity=0,
    )


@warehouse_router.get("", response_model=List[WarehouseResponse])
async def list_warehouses(
    skip: int = Query(0, ge=0, description="Offset / skip count"),
    limit: int = Query(20, ge=1, le=100, description="Pagination size limit"),
    db: AsyncSession = Depends(get_db),
):
    """List all warehouses including products and current quantities inside them."""
    stmt = (
        select(Warehouse)
        .options(selectinload(Warehouse.stock_entries).selectinload(WarehouseStock.product))
        .order_by(Warehouse.id.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    warehouses = result.scalars().all()

    response = []
    for w in warehouses:
        products_stock = [
            WarehouseProductStock(
                product_id=s.product_id,
                product_name=s.product.name if s.product else "",
                quantity=s.quantity,
            )
            for s in w.stock_entries
        ]
        response.append(
            WarehouseResponse(
                id=w.id,
                name=w.name,
                address=w.address,
                max_q=w.max_q,
                products=products_stock,
                total_quantity=sum(s.quantity for s in w.stock_entries),
            )
        )

    return response


@warehouse_router.get("/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(
    warehouse_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single warehouse by ID including current quantity of products inside it."""
    stmt = (
        select(Warehouse)
        .options(selectinload(Warehouse.stock_entries).selectinload(WarehouseStock.product))
        .where(Warehouse.id == warehouse_id)
    )
    result = await db.execute(stmt)
    warehouse = result.scalar_one_or_none()

    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warehouse with ID {warehouse_id} not found",
        )

    products_stock = [
        WarehouseProductStock(
            product_id=s.product_id,
            product_name=s.product.name if s.product else "",
            quantity=s.quantity,
        )
        for s in warehouse.stock_entries
    ]

    return WarehouseResponse(
        id=warehouse.id,
        name=warehouse.name,
        address=warehouse.address,
        max_q=warehouse.max_q,
        products=products_stock,
        total_quantity=sum(s.quantity for s in warehouse.stock_entries),
    )


@warehouse_router.patch("/{warehouse_id}", response_model=WarehouseResponse)
async def update_warehouse(
    warehouse_id: int,
    payload: WarehouseUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Partially update a warehouse by ID (only attributes provided in payload)."""
    stmt = (
        select(Warehouse)
        .options(selectinload(Warehouse.stock_entries).selectinload(WarehouseStock.product))
        .where(Warehouse.id == warehouse_id)
    )
    result = await db.execute(stmt)
    warehouse = result.scalar_one_or_none()

    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warehouse with ID {warehouse_id} not found",
        )

    if payload.name is not None:
        new_name = payload.name.strip()
        dup_stmt = select(Warehouse).where(
            func.lower(Warehouse.name) == new_name.lower(),
            Warehouse.id != warehouse_id,
        )
        dup_res = await db.execute(dup_stmt)
        if dup_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warehouse with name '{new_name}' already exists",
            )
        warehouse.name = new_name

    if payload.address is not None:
        warehouse.address = payload.address.strip()

    if payload.max_q is not None:
        warehouse.max_q = payload.max_q

    await db.commit()

    res_stmt = (
        select(Warehouse)
        .options(selectinload(Warehouse.stock_entries).selectinload(WarehouseStock.product))
        .where(Warehouse.id == warehouse_id)
    )
    updated_res = await db.execute(res_stmt)
    updated_warehouse = updated_res.scalar_one()

    products_stock = [
        WarehouseProductStock(
            product_id=s.product_id,
            product_name=s.product.name if s.product else "",
            quantity=s.quantity,
        )
        for s in updated_warehouse.stock_entries
    ]

    return WarehouseResponse(
        id=updated_warehouse.id,
        name=updated_warehouse.name,
        address=updated_warehouse.address,
        max_q=updated_warehouse.max_q,
        products=products_stock,
        total_quantity=sum(s.quantity for s in updated_warehouse.stock_entries),
    )