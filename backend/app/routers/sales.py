from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.credit import CreditTransaction
from app.schemas.sale import SaleCreate, SaleOut
from app.deps import get_current_admin, get_current_cashier_or_admin

router = APIRouter(prefix="/sales", tags=["sales"])
CREDIT_LIMIT = -10000

def enrich(sale):
    sale.customer_name = sale.customer.name if sale.customer else None
    return sale

@router.get("/", response_model=List[SaleOut])
def list_sales(db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    return [enrich(s) for s in db.query(Sale).order_by(Sale.created_at.desc()).limit(100).all()]

@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    s = db.query(Sale).filter(Sale.id == sale_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return enrich(s)

@router.post("/", response_model=SaleOut)
def create_sale(data: SaleCreate, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    total = 0
    items = []
    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
        subtotal = item.unit_price * item.quantity
        total += subtotal
        product.stock -= item.quantity
        items.append(SaleItem(product_id=item.product_id, quantity=item.quantity,
                               unit_price=item.unit_price, subtotal=subtotal))
    total -= data.discount
    if data.payment_method == 'credit':
        if not data.customer_id:
            raise HTTPException(status_code=400, detail="Se requiere cliente para pago a crédito")
        customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        if customer.balance - total < CREDIT_LIMIT:
            raise HTTPException(status_code=400, detail=f"Límite de crédito excedido. Disponible: ${customer.balance - CREDIT_LIMIT:.2f}")
    sale = Sale(customer_id=data.customer_id, total=total, discount=data.discount,
                payment_method=data.payment_method)
    db.add(sale)
    db.flush()
    for item in items:
        item.sale_id = sale.id
        db.add(item)
    if data.payment_method == 'credit':
        customer.balance -= total
        db.add(CreditTransaction(customer_id=customer.id, sale_id=sale.id,
                                  type="charge", amount=total, balance_after=customer.balance,
                                  notes=f"Venta #{sale.id}"))
    db.commit()
    db.refresh(sale)
    return enrich(sale)

@router.post("/{sale_id}/cancel", response_model=SaleOut)
def cancel_sale(sale_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if sale.status == "cancelled":
        raise HTTPException(status_code=400, detail="La venta ya está cancelada")
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity
    sale.status = "cancelled"
    db.commit()
    db.refresh(sale)
    return enrich(sale)
