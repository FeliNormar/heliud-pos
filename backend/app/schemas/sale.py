from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class SaleItemOut(SaleItemCreate):
    id: int
    subtotal: float
    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[SaleItemCreate]
    discount: float = 0
    payment_method: str = "cash"

class SaleOut(BaseModel):
    id: int
    customer_id: Optional[int]
    customer_name: Optional[str] = None
    total: float
    discount: float
    payment_method: str
    status: str
    has_returns: bool = False
    created_at: datetime
    items: List[SaleItemOut] = []
    class Config:
        from_attributes = True
