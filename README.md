# Heliud POS

Sistema de punto de venta para refaccionaria.

## Requisitos

- Python 3.10+
- Node 18+

## Backend

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

API disponible en: http://localhost:8000  
Documentación Swagger: http://localhost:8000/docs

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible en: http://localhost:5173

## Primer uso

Crea el usuario admin desde Swagger (`POST /auth/register`):

```json
{
  "username": "admin",
  "password": "admin123",
  "role": "admin"
}
```

## Stack

- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React 18 + Vite + TailwindCSS + Zustand + Axios
