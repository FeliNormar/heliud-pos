from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    barcode: Optional[str] = None
    price: float
    cost: float = 0
    stock: int = 0
    min_stock: int = 5
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock: Optional[int] = None
    min_stock: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ProductOut(ProductBase):
    id: int
    category: Optional[CategoryOut] = None
    class Config:
        from_attributes = True
