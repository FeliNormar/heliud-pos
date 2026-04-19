from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CreditTransactionOut(BaseModel):
    id: int
    customer_id: int
    sale_id: Optional[int] = None
    type: str
    amount: float
    balance_after: float
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class CreditPaymentCreate(BaseModel):
    amount: float
    notes: Optional[str] = None
