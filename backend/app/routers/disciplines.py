from fastapi import APIRouter
from supabase import create_client
import os

router = APIRouter()

@router.get("/")
async def get_disciplines():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    print(f"URL: {url}")
    print(f"KEY: {key[:30] if key else 'None'}...")
    
    if not url or not key:
        print("ERROR: Variables de entorno no cargadas")
        return {"error": "Supabase no configurado"}
    
    supabase = create_client(url, key)
    response = supabase.table("disciplines").select("*").execute()
    
    print(f"Registros encontrados: {len(response.data)}")
    print(f"Datos: {response.data}")
    
    return response.data
