from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CashOpenInput(BaseModel):
    opening_amount: float
    notes: Optional[str] = None

class CashCloseInput(BaseModel):
    closing_amount: float
    notes: Optional[str] = None

class CashRegisterOut(BaseModel):
    id: int
    opened_by: int
    opener_username: Optional[str] = None
    closed_by: Optional[int] = None
    closer_username: Optional[str] = None
    opening_amount: float
    closing_amount: Optional[float] = None
    expected_cash: Optional[float] = None
    difference: Optional[float] = None
    status: str
    notes: Optional[str] = None
    opened_at: datetime
    closed_at: Optional[datetime] = None
    class Config:
        from_attributes = True
