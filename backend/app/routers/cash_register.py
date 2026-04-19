from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.cash_register import CashRegister
from app.models.sale import Sale, SaleItem
from app.models.returns import SaleReturn, SaleReturnItem
from app.schemas.cash_register import CashOpenInput, CashCloseInput, CashRegisterOut
from app.deps import get_current_admin, get_current_cashier_or_admin

router = APIRouter(prefix="/cash-register", tags=["cash-register"])


def enrich(cr):
    cr.opener_username = cr.opener.username if cr.opener else None
    cr.closer_username = cr.closer.username if cr.closer else None
    return cr


def get_shift_summary(db: Session, cr: CashRegister):
    """Calcula ventas del turno entre opened_at y closed_at (o ahora)."""
    end = cr.closed_at or datetime.utcnow()
    sales = db.query(Sale).filter(
        Sale.created_at >= cr.opened_at,
        Sale.created_at <= end,
        Sale.status != "cancelled"
    ).all()

    by_method = {}
    for s in sales:
        by_method[s.payment_method] = by_method.get(s.payment_method, 0) + s.total

    cash_sales = by_method.get("cash", 0)

    # Devoluciones en efectivo del turno
    cash_returns = 0
    for s in sales:
        if s.payment_method == "cash":
            for r in db.query(SaleReturn).filter(
                SaleReturn.sale_id == s.id,
                SaleReturn.created_at >= cr.opened_at,
                SaleReturn.created_at <= end
            ).all():
                cash_returns += r.total_refunded

    expected_cash = cr.opening_amount + cash_sales - cash_returns

    return {
        "sales_count": len(sales),
        "by_method": by_method,
        "cash_sales": cash_sales,
        "cash_returns": cash_returns,
        "expected_cash": expected_cash,
    }


@router.get("/current", response_model=Optional[CashRegisterOut])
def get_current(db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    cr = db.query(CashRegister).filter(CashRegister.status == "open").first()
    if not cr:
        return None
    return enrich(cr)


@router.get("/", response_model=List[CashRegisterOut])
def list_registers(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                   db: Session = Depends(get_db), _=Depends(get_current_admin)):
    items = (db.query(CashRegister)
             .order_by(CashRegister.opened_at.desc())
             .offset((page - 1) * page_size).limit(page_size).all())
    return [enrich(cr) for cr in items]


@router.get("/{register_id}")
def get_register(register_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    cr = db.query(CashRegister).filter(CashRegister.id == register_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    summary = get_shift_summary(db, cr)
    out = enrich(cr)
    return {
        "id": out.id, "opener_username": out.opener_username,
        "closer_username": out.closer_username,
        "opening_amount": out.opening_amount, "closing_amount": out.closing_amount,
        "expected_cash": out.expected_cash, "difference": out.difference,
        "status": out.status, "notes": out.notes,
        "opened_at": out.opened_at, "closed_at": out.closed_at,
        **summary,
    }


@router.post("/open", response_model=CashRegisterOut)
def open_register(data: CashOpenInput, db: Session = Depends(get_db), user=Depends(get_current_admin)):
    existing = db.query(CashRegister).filter(CashRegister.status == "open").first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya hay una caja abierta")
    cr = CashRegister(opened_by=user.id, opening_amount=data.opening_amount, notes=data.notes)
    db.add(cr)
    db.commit()
    db.refresh(cr)
    return enrich(cr)


@router.post("/close", response_model=CashRegisterOut)
def close_register(data: CashCloseInput, db: Session = Depends(get_db), user=Depends(get_current_admin)):
    cr = db.query(CashRegister).filter(CashRegister.status == "open").first()
    if not cr:
        raise HTTPException(status_code=400, detail="No hay caja abierta")
    summary = get_shift_summary(db, cr)
    cr.closing_amount = data.closing_amount
    cr.expected_cash = summary["expected_cash"]
    cr.difference = data.closing_amount - summary["expected_cash"]
    cr.closed_by = user.id
    cr.closed_at = datetime.utcnow()
    cr.status = "closed"
    if data.notes:
        cr.notes = data.notes
    db.commit()
    db.refresh(cr)
    return enrich(cr)
