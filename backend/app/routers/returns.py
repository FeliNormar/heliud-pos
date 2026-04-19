from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.credit import CreditTransaction
from app.models.returns import SaleReturn, SaleReturnItem
from app.schemas.returns import SaleReturnCreate, SaleReturnOut
from app.deps import get_current_admin, get_current_cashier_or_admin

router = APIRouter(prefix="/sales", tags=["returns"])

@router.get("/{sale_id}/returns", response_model=List[SaleReturnOut])
def list_returns(sale_id: int, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return db.query(SaleReturn).filter(SaleReturn.sale_id == sale_id).order_by(SaleReturn.created_at.desc()).all()

@router.post("/{sale_id}/returns", response_model=SaleReturnOut)
def create_return(sale_id: int, data: SaleReturnCreate,
                  db: Session = Depends(get_db), _=Depends(get_current_admin)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if sale.status not in ("completed", "returned"):
        raise HTTPException(status_code=400, detail="Solo se pueden devolver ventas completadas")

    prev_returns = db.query(SaleReturn).filter(SaleReturn.sale_id == sale_id).all()
    already_returned = {}
    for r in prev_returns:
        for ri in r.items:
            already_returned[ri.sale_item_id] = already_returned.get(ri.sale_item_id, 0) + ri.quantity

    total_refunded = 0
    return_items = []
    for req in data.items:
        if req.quantity <= 0:
            continue
        sale_item = db.query(SaleItem).filter(SaleItem.id == req.sale_item_id,
                                               SaleItem.sale_id == sale_id).first()
        if not sale_item:
            raise HTTPException(status_code=404, detail=f"Item {req.sale_item_id} no pertenece a esta venta")
        max_returnable = sale_item.quantity - already_returned.get(req.sale_item_id, 0)
        if req.quantity > max_returnable:
            raise HTTPException(status_code=400, detail=f"Solo puedes devolver {max_returnable} unidades del item {req.sale_item_id}")
        product = db.query(Product).filter(Product.id == sale_item.product_id).first()
        if product:
            product.stock += req.quantity
        subtotal = req.quantity * sale_item.unit_price
        total_refunded += subtotal
        return_items.append(SaleReturnItem(sale_item_id=req.sale_item_id,
                                           quantity=req.quantity, unit_price=sale_item.unit_price))

    if not return_items:
        raise HTTPException(status_code=400, detail="No hay items válidos para devolver")

    sale_return = SaleReturn(sale_id=sale_id, total_refunded=total_refunded, notes=data.notes)
    db.add(sale_return)
    db.flush()
    for ri in return_items:
        ri.return_id = sale_return.id
        db.add(ri)

    sale.has_returns = True
    all_items = db.query(SaleItem).filter(SaleItem.sale_id == sale_id).all()
    updated_returned = dict(already_returned)
    for ri in return_items:
        updated_returned[ri.sale_item_id] = updated_returned.get(ri.sale_item_id, 0) + ri.quantity
    if all(updated_returned.get(i.id, 0) >= i.quantity for i in all_items):
        sale.status = "returned"

    if sale.payment_method == "credit" and sale.customer_id:
        customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
        if customer:
            customer.balance += total_refunded
            db.add(CreditTransaction(customer_id=customer.id, sale_id=sale_id,
                                     type="payment", amount=total_refunded,
                                     balance_after=customer.balance,
                                     notes=f"Devolución venta #{sale_id}"))
    db.commit()
    db.refresh(sale_return)
    return sale_return
