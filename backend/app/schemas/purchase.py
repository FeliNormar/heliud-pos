from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class POItemCreate(BaseModel):
    product_id: int
    quantity_ordered: int
    unit_cost_estimated: float

class POItemUpdate(BaseModel):
    product_id: Optional[int] = None
    quantity_ordered: Optional[int] = None
    unit_cost_estimated: Optional[float] = None

class POItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity_ordered: int
    quantity_received: Optional[int] = None
    unit_cost_estimated: float
    unit_cost_actual: Optional[float] = None
    class Config:
        from_attributes = True

class POCreate(BaseModel):
    supplier_id: int
    items: List[POItemCreate]
    notes: Optional[str] = None

class POUpdate(BaseModel):
    supplier_id: Optional[int] = None
    items: Optional[List[POItemCreate]] = None
    notes: Optional[str] = None

class ReceiveItemInput(BaseModel):
    item_id: int
    quantity_received: int
    unit_cost_actual: float

class ReceiveInput(BaseModel):
    items: List[ReceiveItemInput]
    notes: Optional[str] = None

class POOut(BaseModel):
    id: int
    supplier_id: int
    supplier_name: Optional[str] = None
    created_by: int
    status: str
    notes: Optional[str] = None
    total_estimated: float
    total_actual: Optional[float] = None
    created_at: datetime
    received_at: Optional[datetime] = None
    items: List[POItemOut] = []
    class Config:
        from_attributes = True
