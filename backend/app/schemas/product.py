from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ProductType


# Category Schemas
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


# Product Schemas
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category_id: int
    base_price: Decimal = Field(..., ge=0, description="Base selling price must be >= 0")
    cost_price: Decimal = Field(..., ge=0, description="Cost price must be >= 0")
    description: Optional[str] = None
    product_type: ProductType


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category_id: Optional[int] = None
    base_price: Optional[Decimal] = Field(default=None, ge=0)
    cost_price: Optional[Decimal] = Field(default=None, ge=0)
    description: Optional[str] = None
    product_type: Optional[ProductType] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    category_id: int
    base_price: Decimal
    cost_price: Decimal
    description: Optional[str] = None
    product_type: ProductType
    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)
