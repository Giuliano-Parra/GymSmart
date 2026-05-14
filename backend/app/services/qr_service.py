import hmac
import hashlib
import time
import base64
import os
import qrcode
from io import BytesIO
import base64

SECRET_KEY = os.getenv("HMAC_SECRET_KEY", "mi-clave-secreta-cambiar-en-produccion")
QR_EXPIRATION = int(os.getenv("QR_EXPIRATION_SECONDS", "60"))

def generate_qr_token():
    """Genera un token seguro con timestamp y firma HMAC"""
    timestamp = int(time.time())
    message = f"{timestamp}"
    signature = hmac.new(
        SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    token = f"{timestamp}:{signature}"
    return token

def verify_qr_token(token):
    """Verifica que el token sea válido y no haya expirado"""
    try:
        timestamp_str, signature = token.split(":")
        timestamp = int(timestamp_str)
        
        # Verificar expiración
        if time.time() - timestamp > QR_EXPIRATION:
            return False, "Token expirado"
        
        # Recalcular firma
        expected = hmac.new(
            SECRET_KEY.encode(),
            timestamp_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Comparar firmas (const time para evitar timing attacks)
        if not hmac.compare_digest(signature, expected):
            return False, "Firma inválida"
        
        return True, "Válido"
    except Exception as e:
        return False, f"Error: {str(e)}"

def generate_qr_image():
    """Genera imagen QR en base64 del token actual"""
    token = generate_qr_token()
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(token)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return {
        "token": token,
        "qr_base64": f"data:image/png;base64,{img_base64}",
        "expires_in": QR_EXPIRATION
    }
