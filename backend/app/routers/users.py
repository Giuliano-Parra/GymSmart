from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client, Client
import os

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

@router.get("/profile/{user_id}")
async def get_profile(user_id: str, supabase: Client = Depends(get_supabase)):
    response = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(404, "Usuario no encontrado")
    return response.data[0]

@router.put("/profile/{user_id}")
async def update_profile(user_id: str, profile_data: dict, supabase: Client = Depends(get_supabase)):
    response = supabase.table("profiles").update(profile_data).eq("id", user_id).execute()
    return {"message": "Perfil actualizado", "data": response.data}
