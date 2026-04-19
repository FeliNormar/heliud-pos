from fastapi import Depends, HTTPException
from app.routers.auth import get_current_user
from app.models.user import User

def get_current_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    return user

def get_current_cashier_or_admin(user: User = Depends(get_current_user)):
    if user.role not in ("admin", "cashier"):
        raise HTTPException(status_code=403, detail="Acceso no autorizado")
    return user
