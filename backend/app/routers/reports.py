from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.deps import get_current_admin, get_current_cashier_or_admin

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/summary")
def daily_summary(day: date = None, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    if not day:
        day = date.today()
    start = datetime.combine(day, datetime.min.time())
    end = datetime.combine(day, datetime.max.time())
    sales = db.query(Sale).filter(Sale.created_at.between(start, end)).all()
    total = sum(s.total for s in sales)
    return {"date": str(day), "total_sales": len(sales), "total_revenue": total}

@router.get("/top-products")
def top_products(limit: int = 10, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    results = (
        db.query(Product.name, func.sum(SaleItem.quantity).label("sold"))
        .join(SaleItem, SaleItem.product_id == Product.id)
        .group_by(Product.id)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(limit).all()
    )
    return [{"name": r.name, "sold": r.sold} for r in results]

@router.get("/revenue-by-day")
def revenue_by_day(db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    results = (
        db.query(func.date(Sale.created_at).label("day"), func.sum(Sale.total).label("revenue"))
        .group_by(func.date(Sale.created_at))
        .order_by(func.date(Sale.created_at).desc())
        .limit(30).all()
    )
    return [{"day": str(r.day), "revenue": r.revenue} for r in results]

@router.get("/profit")
def profit_report(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    results = (
        db.query(Product.name,
                 func.sum(SaleItem.quantity).label("qty"),
                 func.sum(SaleItem.subtotal).label("revenue"),
                 func.sum(SaleItem.quantity * Product.cost).label("cost"))
        .join(SaleItem, SaleItem.product_id == Product.id)
        .group_by(Product.id).all()
    )
    return [{"name": r.name, "qty": r.qty,
             "revenue": round(r.revenue or 0, 2),
             "cost": round(r.cost or 0, 2),
             "profit": round((r.revenue or 0) - (r.cost or 0), 2)} for r in results]
