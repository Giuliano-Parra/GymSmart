from fastapi import APIRouter, Depends
from supabase import create_client, Client
from datetime import date
import os

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

@router.post("/register")
async def register_payment(payment: dict, supabase: Client = Depends(get_supabase)):
    payment["payment_date"] = str(date.today())
    response = supabase.table("payments").insert(payment).execute()
    return {"message": "Pago registrado", "data": response.data}

@router.get("/user/{user_id}")
async def get_user_payments(user_id: str, supabase: Client = Depends(get_supabase)):
    response = supabase.table("payments").select("*").eq("user_id", user_id).order("payment_date", desc=True).execute()
    return response.data
