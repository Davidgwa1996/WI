from __future__ import annotations

import asyncio
import time

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db, init_db
from app.websocket_manager import manager

listen_to_events = None
detect_anomalies = None
update_all_projects = None

try:
    from app.utils.pubsub import listen_to_events
except Exception as e:
    print(f"WARNING: Pub/Sub listener not available: {e}")

try:
    from app.analytics.anomaly_stream import detect_anomalies
except Exception as e:
    print(f"WARNING: Anomaly stream not available: {e}")

try:
    from app.tasks.scraper_tasks import update_all_projects
except Exception as e:
    print(f"WARNING: Celery scraper task not available: {e}")

from app.routes import (
    auth_router,
    users_router,
    organizations_router,
    api_keys_router,
    subscriptions_router,
    audit_logs_router,
    invites_router,
    workspace_router,
    billing_router,
    watchlists_router,
    reports_router,
    briefings_router,
    search_router,
    exports_router,
    agent_router,
)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(organizations_router, prefix=settings.API_PREFIX)
app.include_router(api_keys_router, prefix=settings.API_PREFIX)
app.include_router(subscriptions_router, prefix=settings.API_PREFIX)
app.include_router(audit_logs_router, prefix=settings.API_PREFIX)
app.include_router(invites_router, prefix=settings.API_PREFIX)
app.include_router(workspace_router, prefix=settings.API_PREFIX)
app.include_router(billing_router, prefix=settings.API_PREFIX)
app.include_router(watchlists_router, prefix=settings.API_PREFIX)
app.include_router(reports_router, prefix=settings.API_PREFIX)
app.include_router(briefings_router, prefix=settings.API_PREFIX)
app.include_router(search_router, prefix=settings.API_PREFIX)
app.include_router(exports_router, prefix=settings.API_PREFIX)
app.include_router(agent_router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "message": settings.APP_NAME,
        "status": "running",
        "api_prefix": settings.API_PREFIX,
        "websocket_path": settings.WS_PATH,
        "environment": settings.APP_ENV,
    }


@app.get(f"{settings.API_PREFIX}/health", response_model=schemas.HealthResponse)
def health():
    return schemas.HealthResponse(
        status="healthy",
        timestamp=time.time(),
        app_name=settings.APP_NAME,
    )


@app.get(f"{settings.API_PREFIX}/projects", response_model=list[schemas.ProjectOut])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    stage: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    if db is None:
        return []

    query = db.query(models.Project)

    if stage:
        query = query.filter(models.Project.stage == stage)

    if sector:
        query = query.filter(models.Project.sector == sector)

    return query.offset(skip).limit(limit).all()


@app.get(f"{settings.API_PREFIX}/projects/summary", response_model=list[schemas.ProjectListItem])
def get_project_summaries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if db is None:
        return []

    return db.query(models.Project).offset(skip).limit(limit).all()


@app.get(f"{settings.API_PREFIX}/projects/{{project_id}}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@app.post(f"{settings.API_PREFIX}/projects/refresh", response_model=schemas.ApiMessage)
def refresh_projects():
    if update_all_projects is None:
        raise HTTPException(status_code=503, detail="Refresh worker is not available")

    try:
        update_all_projects.delay()
        return schemas.ApiMessage(message="Project refresh task started")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not start refresh task: {e}")


@app.get(f"{settings.API_PREFIX}/metrics")
def metrics(db: Session = Depends(get_db)):
    total_projects = 0

    if db is not None:
      try:
          total_projects = db.query(models.Project).count()
      except Exception as e:
          print(f"WARNING: Could not count projects: {e}")

    return {
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "projects": total_projects,
        "websocket_connections": manager.connection_count(),
        "redis_enabled": settings.ENABLE_REDIS,
        "websockets_enabled": settings.ENABLE_WEBSOCKETS,
        "ai_enabled": settings.ENABLE_AI,
        "scrapers_enabled": settings.ENABLE_SCRAPERS,
    }


@app.websocket(settings.WS_PATH)
async def websocket_endpoint(websocket: WebSocket):
    if not settings.ENABLE_WEBSOCKETS:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await manager.send_personal_message({"type": "pong"}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"WARNING: Database init failed: {e}")

    if settings.ENABLE_REDIS and listen_to_events is not None:
        try:
            asyncio.create_task(listen_to_events())
            print("Redis pub/sub listener started")
        except Exception as e:
            print(f"WARNING: Could not start pub/sub listener: {e}")

    if detect_anomalies is not None:
        try:
            asyncio.create_task(detect_anomalies())
            print("Anomaly detection stream started")
        except Exception as e:
            print(f"WARNING: Could not start anomaly stream: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=False,
    )