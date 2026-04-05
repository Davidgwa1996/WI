# backend/app/api/routes_health.py
from fastapi import APIRouter
import time

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": time.time()
    }