from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ReturnItemCreate(BaseModel):
    sale_item_id: int
    quantity: int

class SaleReturnCreate(BaseModel):
    items: List[ReturnItemCreate]
    notes: Optional[str] = None

class SaleReturnItemOut(BaseModel):
    id: int
    sale_item_id: int
    quantity: int
    unit_price: float
    class Config:
        from_attributes = True

class SaleReturnOut(BaseModel):
    id: int
    sale_id: int
    total_refunded: float
    notes: Optional[str] = None
    created_at: datetime
    items: List[SaleReturnItemOut] = []
    class Config:
        from_attributes = True
