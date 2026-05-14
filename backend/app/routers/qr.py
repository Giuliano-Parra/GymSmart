from fastapi import APIRouter, HTTPException
from app.services.qr_service import generate_qr_image, verify_qr_token

router = APIRouter()

@router.get("/generate")
async def get_qr():
    """Genera un nuevo QR dinámico"""
    return generate_qr_image()

@router.post("/verify")
async def verify_qr(data: dict):
    """Verifica un token escaneado"""
    token = data.get("token")
    if not token:
        raise HTTPException(400, "Token requerido")
    
    is_valid, message = verify_qr_token(token)
    return {
        "valid": is_valid,
        "message": message
    }
