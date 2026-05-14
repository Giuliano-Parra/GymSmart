from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client
from datetime import datetime, date
import os
import traceback

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise HTTPException(500, f"Supabase no configurado")
    
    return create_client(url, key)

@router.post("/scan-checkin")
async def scan_checkin(data: dict, supabase = Depends(get_supabase)):
    try:
        token = data.get("token")
        user_id = data.get("user_id")
        
        if not token or not user_id:
            raise HTTPException(400, "Faltan token o user_id")
        
        print(f"🔍 Escaneando QR para usuario: {user_id}")
        print(f"📝 Token recibido: {token[:50]}...")
        
        # Obtener membresía activa
        today = date.today().isoformat()
        print(f"📅 Fecha actual: {today}")
        
        memberships = supabase.table("memberships")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("status", "active")\
            .execute()
        
        print(f"📊 Membresías encontradas: {len(memberships.data)}")
        
        if not memberships.data:
            raise HTTPException(400, "No tiene membresía activa")
        
        membership = memberships.data[0]
        
        # Registrar asistencia
        attendance_data = {
            "user_id": user_id,
            "membership_id": membership["id"],
            "qr_token": token,
            "scanned_at": datetime.now().isoformat()
        }
        
        result = supabase.table("attendances").insert(attendance_data).execute()
        
        print(f"✅ Asistencia registrada ID: {result.data[0]['id']}")
        
        return {"valid": True, "message": "Asistencia registrada", "attendance_id": result.data[0]["id"]}
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(500, f"Error interno: {str(e)}")

@router.post("/checkin")
async def register_attendance(attendance: dict, supabase = Depends(get_supabase)):
    membership = supabase.table("memberships").select("*").eq("id", attendance["membership_id"]).eq("status", "active").execute()
    if not membership.data:
        raise HTTPException(400, "Membresía inactiva o no válida")
    
    attendance["scanned_at"] = str(datetime.now())
    response = supabase.table("attendances").insert(attendance).execute()
    return {"message": "Asistencia registrada", "data": response.data}

@router.get("/history/{user_id}")
async def get_attendance_history(user_id: str, supabase = Depends(get_supabase)):
    response = supabase.table("attendances").select("*, memberships(plan_id)").eq("user_id", user_id).order("scanned_at", desc=True).execute()
    return response.data
