# backend/app/api/router.py
from fastapi import APIRouter
from app.api.routes_health import router as health_router
from app.api.routes_projects import router as projects_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(projects_router)