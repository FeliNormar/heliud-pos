# Heliud POS

Sistema de punto de venta para refaccionaria. Gestión de ventas, inventario, clientes, proveedores, órdenes de compra, crédito y corte de caja.

---

## Requisitos

- Python 3.10+
- Node 18+

---

## Instalación y uso

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

API disponible en: `http://localhost:8000`  
Documentación Swagger: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible en: `http://localhost:5173`

### Primer usuario

Desde Swagger (`POST /auth/register`):

```json
{
  "username": "admin",
  "password": "admin123",
  "role": "admin"
}
```

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + SQLAlchemy + SQLite |
| Frontend | React 18 + Vite + TailwindCSS |
| Estado | Zustand |
| HTTP | Axios |
| Gráficas | Recharts |
| Exportación | openpyxl + reportlab |

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| 🛒 POS | Venta rápida, carrito, cambio, crédito, ticket imprimible |
| 📦 Inventario | CRUD productos, fotos, stock bajo, importación Excel |
| 👥 Clientes | CRUD, cuenta corriente, historial de crédito, abonos |
| 🧾 Ventas | Historial, cancelación, devolución parcial, exportar Excel/PDF |
| 📊 Reportes | Ingresos, utilidad, ventas por método de pago, exportar |
| 🏭 Proveedores | CRUD, RFC, soft delete (solo admin) |
| 📋 Órdenes de compra | Crear, enviar, recibir mercancía, actualiza stock y costo |
| 👤 Usuarios | CRUD, roles admin/cajero, reset de contraseña (solo admin) |
| 💰 Corte de caja | Apertura/cierre de turno, efectivo esperado vs contado |

---

## Estructura del proyecto

```
heliud-pos/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   │   ├── product.py
│   │   │   ├── sale.py
│   │   │   ├── customer.py
│   │   │   ├── supplier.py
│   │   │   ├── user.py
│   │   │   ├── credit.py
│   │   │   ├── returns.py
│   │   │   ├── purchase.py
│   │   │   └── cash_register.py
│   │   ├── routers/         # Endpoints FastAPI
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── sales.py
│   │   │   ├── customers.py
│   │   │   ├── credit.py
│   │   │   ├── returns.py
│   │   │   ├── suppliers.py
│   │   │   ├── purchase_orders.py
│   │   │   ├── users.py
│   │   │   ├── reports.py
│   │   │   ├── export.py
│   │   │   ├── import_products.py
│   │   │   └── cash_register.py
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── deps.py          # Dependencias de roles (admin / cashier)
│   │   ├── database.py
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Cart.jsx
│   │   │   ├── CashRegisterWidget.jsx
│   │   │   ├── CustomerSearch.jsx
│   │   │   ├── ExportButtons.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── ProductSearch.jsx
│   │   │   ├── ReturnModal.jsx
│   │   │   ├── TicketPrint.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── POS.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── CustomerDetail.jsx
│   │   │   ├── Sales.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   ├── PurchaseOrders.jsx
│   │   │   ├── PurchaseOrderDetail.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── CashRegister.jsx
│   │   │   └── Login.jsx
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   └── cartStore.js
│   │   └── services/
│   │       ├── api.js
│   │       └── download.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Roles

| Rol | Acceso |
|-----|--------|
| `admin` | Todo el sistema |
| `cashier` | POS, inventario (lectura/crear), clientes, ventas, reportes básicos |
