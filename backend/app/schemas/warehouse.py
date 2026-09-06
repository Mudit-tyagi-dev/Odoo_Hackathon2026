from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class WarehouseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    address: Optional[str] = Field(default="Gandhinagar, Gujarat", max_length=1000)
    max_q: Optional[int] = Field(default=500, ge=1)


class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    address: Optional[str] = Field(default=None, max_length=1000)
    max_q: Optional[int] = Field(default=None, ge=1)



class WarehouseProductStock(BaseModel):
    product_id: int
    product_name: str
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class WarehouseResponse(BaseModel):
    id: int
    name: str
    address: str
    max_q: int
    products: List[WarehouseProductStock] = []
    total_quantity: int = 0

    model_config = ConfigDict(from_attributes=True)


class WarehouseStockCreate(BaseModel):
    warehouse_id: int = Field(..., gt=0, description="Warehouse ID")
    product_id: int = Field(..., gt=0, description="Product ID")
    quantity: int = Field(..., ge=0, description="Quantity of stock")


class WarehouseStockResponse(BaseModel):
    warehouse_id: int
    product_id: int
    quantity: int
    warehouse_name: Optional[str] = None
    product_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

