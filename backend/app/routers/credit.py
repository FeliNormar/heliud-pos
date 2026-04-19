from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.customer import Customer
from app.models.credit import CreditTransaction
from app.schemas.credit import CreditTransactionOut, CreditPaymentCreate
from app.deps import get_current_cashier_or_admin

router = APIRouter(prefix="/customers", tags=["credit"])
CREDIT_LIMIT = -10000

@router.get("/{customer_id}/credit-balance")
def credit_balance(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"customer_id": c.id, "name": c.name, "balance": c.balance}

@router.get("/{customer_id}/credit-transactions", response_model=List[CreditTransactionOut])
def credit_transactions(customer_id: int, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return (db.query(CreditTransaction)
            .filter(CreditTransaction.customer_id == customer_id)
            .order_by(CreditTransaction.created_at.desc()).all())

@router.post("/{customer_id}/credit-payment", response_model=CreditTransactionOut)
def credit_payment(customer_id: int, data: CreditPaymentCreate,
                   db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
    c.balance += data.amount
    tx = CreditTransaction(customer_id=c.id, type="payment",
                           amount=data.amount, balance_after=c.balance, notes=data.notes)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx
