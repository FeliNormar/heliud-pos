from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.product import Product, Category
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, CategoryCreate, CategoryOut
from app.deps import get_current_admin, get_current_cashier_or_admin
import shutil, os, uuid

router = APIRouter(prefix="/products", tags=["products"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[ProductOut])
def list_products(search: Optional[str] = None, category_id: Optional[int] = None,
                  db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    q = db.query(Product)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%") | (Product.barcode == search))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    return q.all()

@router.get("/low-stock", response_model=List[ProductOut])
def low_stock(db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    return db.query(Product).filter(Product.stock <= Product.min_stock).all()

@router.get("/categories/all", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    return db.query(Category).all()

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return p

@router.post("/", response_model=ProductOut)
def create_product(data: ProductCreate, db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    p = Product(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate,
                   db: Session = Depends(get_db), _=Depends(get_current_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(p)
    db.commit()
    return {"ok": True}

@router.post("/{product_id}/image")
async def upload_image(product_id: int, file: UploadFile = File(...),
                       db: Session = Depends(get_db), _=Depends(get_current_cashier_or_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Solo jpg, png o webp")
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    p.image_url = f"/uploads/{filename}"
    db.commit()
    return {"image_url": p.image_url}

@router.post("/categories/", response_model=CategoryOut)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    c = Category(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c
