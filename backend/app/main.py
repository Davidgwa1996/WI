from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
import time

from app.config import settings
from app import models, schemas
from app.database import get_db, init_db
from app.websocket_manager import manager

# Optional realtime/background imports
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


# ------------------------------------------------------------
# FastAPI app
# ------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)


# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------
# Root / Health
# ------------------------------------------------------------
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


# ------------------------------------------------------------
# Projects endpoints
# ------------------------------------------------------------
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


@app.get(
    f"{settings.API_PREFIX}/projects/summary",
    response_model=list[schemas.ProjectListItem]
)
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


# ------------------------------------------------------------
# Realtime refresh trigger
# ------------------------------------------------------------
@app.post(f"{settings.API_PREFIX}/projects/refresh", response_model=schemas.ApiMessage)
def refresh_projects():
    if update_all_projects is None:
        raise HTTPException(status_code=503, detail="Refresh worker is not available")

    try:
        update_all_projects.delay()
        return schemas.ApiMessage(message="Project refresh task started")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not start refresh task: {e}")


# ------------------------------------------------------------
# Metrics / status endpoint
# ------------------------------------------------------------
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


# ------------------------------------------------------------
# WebSocket endpoint
# ------------------------------------------------------------
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


# ------------------------------------------------------------
# Startup
# ------------------------------------------------------------
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


# ------------------------------------------------------------
# Local run support
# ------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=False,
    )