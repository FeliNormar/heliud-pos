from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CashRegister(Base):
    __tablename__ = "cash_registers"
    id = Column(Integer, primary_key=True, index=True)
    opened_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    closed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    opening_amount = Column(Float, nullable=False)
    closing_amount = Column(Float, nullable=True)
    expected_cash = Column(Float, nullable=True)
    difference = Column(Float, nullable=True)
    status = Column(String, default="open")  # open | closed
    notes = Column(String, nullable=True)
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    opener = relationship("User", foreign_keys=[opened_by])
    closer = relationship("User", foreign_keys=[closed_by])
