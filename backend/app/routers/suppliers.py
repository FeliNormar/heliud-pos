from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.deps import get_current_admin

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

@router.get("/", response_model=List[SupplierResponse])
def list_suppliers(search: Optional[str] = None, page: int = Query(1, ge=1),
                   page_size: int = Query(20, ge=1, le=100),
                   db: Session = Depends(get_db), _=Depends(get_current_admin)):
    q = db.query(Supplier).filter(Supplier.is_active == True)
    if search:
        term = f"%{search}%"
        q = q.filter(Supplier.name.ilike(term) | Supplier.contact_name.ilike(term) | Supplier.tax_id.ilike(term))
    return q.order_by(Supplier.name).offset((page - 1) * page_size).limit(page_size).all()

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return s

@router.post("/", response_model=SupplierResponse, status_code=201)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    if data.tax_id:
        if db.query(Supplier).filter(Supplier.tax_id == data.tax_id).first():
            raise HTTPException(status_code=400, detail=f"El RFC '{data.tax_id}' ya está registrado")
    s = Supplier(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, data: SupplierUpdate,
                    db: Session = Depends(get_db), _=Depends(get_current_admin)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    if data.tax_id and data.tax_id != s.tax_id:
        if db.query(Supplier).filter(Supplier.tax_id == data.tax_id, Supplier.id != supplier_id).first():
            raise HTTPException(status_code=400, detail=f"El RFC '{data.tax_id}' ya está registrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    s.is_active = False
    db.commit()
    return {"ok": True, "detail": "Proveedor desactivado"}
