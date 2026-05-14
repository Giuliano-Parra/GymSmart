from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client
import os

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

@router.get("/")
async def get_all_plans(supabase = Depends(get_supabase)):
    response = supabase.table("plans").select("*").eq("is_active", True).execute()
    return response.data

@router.get("/{plan_id}")
async def get_plan(plan_id: int, supabase = Depends(get_supabase)):
    response = supabase.table("plans").select("*").eq("id", plan_id).execute()
    if not response.data:
        raise HTTPException(404, "Plan no encontrado")
    return response.data[0]

@router.post("/")
async def create_plan(plan_data: dict, supabase = Depends(get_supabase)):
    required = ["discipline_id", "name", "price_bs", "duration_days"]
    for field in required:
        if field not in plan_data:
            raise HTTPException(400, f"Campo requerido: {field}")
    
    plan_data["is_active"] = plan_data.get("is_active", True)
    response = supabase.table("plans").insert(plan_data).execute()
    return {"message": "Plan creado", "data": response.data[0]}

@router.put("/{plan_id}")
async def update_plan(plan_id: int, plan_data: dict, supabase = Depends(get_supabase)):
    response = supabase.table("plans").update(plan_data).eq("id", plan_id).execute()
    return {"message": "Plan actualizado", "data": response.data[0]}

@router.delete("/{plan_id}")
async def delete_plan(plan_id: int, supabase = Depends(get_supabase)):
    supabase.table("plans").update({"is_active": False}).eq("id", plan_id).execute()
    return {"message": "Plan desactivado"}
