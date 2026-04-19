from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.purchase import PurchaseOrder, PurchaseOrderItem
from app.models.product import Product
from app.models.supplier import Supplier
from app.schemas.purchase import POCreate, POUpdate, POOut, ReceiveInput
from app.deps import get_current_admin

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])

def enrich(po):
    po.supplier_name = po.supplier.name if po.supplier else None
    for item in po.items:
        item.product_name = item.product.name if item.product else None
    return po

@router.get("/", response_model=List[POOut])
def list_orders(supplier_id: Optional[int] = None, status: Optional[str] = None,
                page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                db: Session = Depends(get_db), _=Depends(get_current_admin)):
    q = db.query(PurchaseOrder)
    if supplier_id:
        q = q.filter(PurchaseOrder.supplier_id == supplier_id)
    if status:
        q = q.filter(PurchaseOrder.status == status)
    return [enrich(o) for o in q.order_by(PurchaseOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()]

@router.get("/{order_id}", response_model=POOut)
def get_order(order_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return enrich(po)

@router.post("/", response_model=POOut, status_code=201)
def create_order(data: POCreate, db: Session = Depends(get_db), user=Depends(get_current_admin)):
    if not db.query(Supplier).filter(Supplier.id == data.supplier_id).first():
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    total = sum(i.quantity_ordered * i.unit_cost_estimated for i in data.items)
    po = PurchaseOrder(supplier_id=data.supplier_id, created_by=user.id,
                       notes=data.notes, total_estimated=total)
    db.add(po)
    db.flush()
    for item in data.items:
        db.add(PurchaseOrderItem(order_id=po.id, product_id=item.product_id,
                                  quantity_ordered=item.quantity_ordered,
                                  unit_cost_estimated=item.unit_cost_estimated))
    db.commit()
    db.refresh(po)
    return enrich(po)

@router.put("/{order_id}", response_model=POOut)
def update_order(order_id: int, data: POUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if po.status != "draft":
        raise HTTPException(status_code=400, detail="Solo se pueden editar órdenes en borrador")
    if data.supplier_id:
        po.supplier_id = data.supplier_id
    if data.notes is not None:
        po.notes = data.notes
    if data.items is not None:
        for old in po.items:
            db.delete(old)
        db.flush()
        po.total_estimated = 0
        for item in data.items:
            po.total_estimated += item.quantity_ordered * item.unit_cost_estimated
            db.add(PurchaseOrderItem(order_id=po.id, product_id=item.product_id,
                                      quantity_ordered=item.quantity_ordered,
                                      unit_cost_estimated=item.unit_cost_estimated))
    db.commit()
    db.refresh(po)
    return enrich(po)

@router.post("/{order_id}/send", response_model=POOut)
def send_order(order_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if po.status != "draft":
        raise HTTPException(status_code=400, detail="Solo se pueden enviar órdenes en borrador")
    po.status = "sent"
    db.commit()
    db.refresh(po)
    return enrich(po)

@router.post("/{order_id}/cancel", response_model=POOut)
def cancel_order(order_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if po.status == "received":
        raise HTTPException(status_code=400, detail="No se puede cancelar una orden ya recibida")
    po.status = "cancelled"
    db.commit()
    db.refresh(po)
    return enrich(po)

@router.post("/{order_id}/receive", response_model=POOut)
def receive_order(order_id: int, data: ReceiveInput,
                  db: Session = Depends(get_db), _=Depends(get_current_admin)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if po.status not in ("sent", "draft"):
        raise HTTPException(status_code=400, detail="La orden no está en estado válido para recibir")
    total_actual = 0
    for recv in data.items:
        item = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.id == recv.item_id,
                                                   PurchaseOrderItem.order_id == order_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {recv.item_id} no pertenece a esta orden")
        item.quantity_received = recv.quantity_received
        item.unit_cost_actual = recv.unit_cost_actual
        total_actual += recv.quantity_received * recv.unit_cost_actual
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += recv.quantity_received
            product.cost = recv.unit_cost_actual
    if data.notes:
        po.notes = data.notes
    po.total_actual = total_actual
    po.status = "received"
    po.received_at = datetime.utcnow()
    db.commit()
    db.refresh(po)
    return enrich(po)
