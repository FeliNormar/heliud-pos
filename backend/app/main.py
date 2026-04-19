from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app.routers import auth, products, sales, customers, reports
from app.routers import import_products, credit, returns, export, suppliers, purchase_orders, users, cash_register
import app.models
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Heliud POS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(customers.router)
app.include_router(reports.router)
app.include_router(import_products.router)
app.include_router(credit.router)
app.include_router(returns.router)
app.include_router(export.router)
app.include_router(suppliers.router)
app.include_router(purchase_orders.router)
app.include_router(users.router)
app.include_router(cash_register.router)

@app.get("/")
def root():
    return {"message": "Heliud POS API"}
