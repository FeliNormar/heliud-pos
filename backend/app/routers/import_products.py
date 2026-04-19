from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product
from app.deps import get_current_admin
import openpyxl
import io

router = APIRouter(prefix="/import", tags=["import"])

@router.post("/products", summary="Importar productos desde Excel")
async def import_products(
    file: UploadFile = File(..., description="Archivo .xlsx con columnas: codigo, nombre, stock, precio"),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx o .xls")

    contents = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(contents))
    ws = wb.active

    # Sin encabezados: col0=codigo, col1=nombre, col2=stock, col3=precio, col4=categoria
    def val(row, idx):
        try:
            v = row[idx].value
            return v if v is not None else None
        except IndexError:
            return None

    created, updated, errors = 0, 0, []

    for i, row in enumerate(ws.iter_rows(min_row=1), start=1):
        try:
            barcode = str(val(row, 0) or "").strip() or None
            name = str(val(row, 1) or "").strip()
            if not name:
                continue

            stock = int(float(val(row, 2) or 0))
            price = float(val(row, 3) or 0)

            existing = None
            if barcode:
                existing = db.query(Product).filter(Product.barcode == barcode).first()
            if not existing:
                existing = db.query(Product).filter(Product.name == name).first()

            if existing:
                existing.price = price
                existing.stock = stock
                if barcode:
                    existing.barcode = barcode
                updated += 1
            else:
                p = Product(name=name, price=price, cost=0,
                            stock=stock, min_stock=5, barcode=barcode)
                db.add(p)
                created += 1

        except Exception as e:
            errors.append(f"Fila {i}: {str(e)}")
            print(f"ERROR Fila {i}: {e}")

    db.commit()
    return {"created": created, "updated": updated, "errors": errors[:10]}
