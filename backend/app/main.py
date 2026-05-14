from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="GymSmart API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

from app.routers import users, memberships, attendance, payments, qr, plans, disciplines

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(memberships.router, prefix="/api/memberships", tags=["Memberships"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(qr.router, prefix="/api/qr", tags=["QR"])
app.include_router(plans.router, prefix="/api/plans", tags=["Plans"])
app.include_router(disciplines.router, prefix="/api/disciplines", tags=["Disciplines"])

@app.get("/")
async def root():
    return {"message": "GymSmart API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}



