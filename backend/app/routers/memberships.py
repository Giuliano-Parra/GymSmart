from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client, Client
from datetime import date, timedelta
import os

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

@router.get("/user/{user_id}")
async def get_user_memberships(user_id: str, supabase: Client = Depends(get_supabase)):
    response = supabase.table("memberships").select("*, plans(*)").eq("user_id", user_id).execute()
    return response.data

@router.post("/create")
async def create_membership(membership: dict, supabase: Client = Depends(get_supabase)):
    plan_response = supabase.table("plans").select("duration_days").eq("id", membership["plan_id"]).execute()
    if not plan_response.data:
        raise HTTPException(404, "Plan no encontrado")
    
    duration = plan_response.data[0]["duration_days"]
    start_date = date.today()
    end_date = start_date + timedelta(days=duration)
    
    membership["start_date"] = str(start_date)
    membership["end_date"] = str(end_date)
    membership["status"] = "active"
    
    response = supabase.table("memberships").insert(membership).execute()
    return {"message": "Membresía creada", "data": response.data}

@router.get("/expiring")
async def get_expiring_memberships(days: int = 7, supabase: Client = Depends(get_supabase)):
    today = date.today()
    expiry_date = today + timedelta(days=days)
    response = supabase.table("memberships").select("*, profiles(email, full_name), plans(name)").eq("status", "active").lte("end_date", str(expiry_date)).execute()
    return response.data

@router.get("/active/{user_id}")
async def get_active_membership(user_id: str, supabase = Depends(get_supabase)):
    today = date.today().isoformat()
    response = supabase.table("memberships")\
        .select("*, plans(*)")\
        .eq("user_id", user_id)\
        .eq("status", "active")\
        .lte("start_date", today)\
        .gte("end_date", today)\
        .execute()
    if not response.data:
        raise HTTPException(404, "No tiene membresía activa")
    return response.data[0]