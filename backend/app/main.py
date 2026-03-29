from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
import asyncio
import os

# ------------------------------------------------------------
# SAFE IMPORTS – fallback if any module is missing
# ------------------------------------------------------------
try:
    from app import models, database, schemas
except ImportError as e:
    print(f"WARNING: Could not import app core modules: {e}")
    models = None
    database = None
    schemas = None

# Scrapers – optional
twitter = github = discord = coingecko = defillama = angellist = crunchbase = producthunt = None
try:
    from app.scrapers import (
        twitter, github, discord, coingecko, defillama,
        angellist, crunchbase, producthunt
    )
except ImportError as e:
    print(f"WARNING: Scrapers not available: {e}")

# AI modules – optional
llm_analyzer = sentiment = momentum = funding_predictor = ensemble = None
try:
    from app.ai import llm_analyzer, sentiment, momentum, funding_predictor, ensemble
except ImportError as e:
    print(f"WARNING: AI modules not available: {e}")

# Analytics – optional
monte_carlo = anomaly_detection = None
try:
    from app.analytics import monte_carlo, anomaly_detection
except ImportError as e:
    print(f"WARNING: Analytics modules not available: {e}")

# WebSocket manager – optional
manager = None
try:
    from app.websocket_manager import manager
except ImportError as e:
    print(f"WARNING: WebSocket manager not available: {e}")
    # Create a dummy manager
    class DummyManager:
        async def connect(self, ws): pass
        def disconnect(self, ws): pass
        async def broadcast(self, msg): pass
    manager = DummyManager()

# ------------------------------------------------------------
# FastAPI app
# ------------------------------------------------------------
app = FastAPI(title="Web3 Deal Sourcing & Market Intelligence")

# CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# Database dependency (safe)
# ------------------------------------------------------------
def get_db():
    if database is None or database.SessionLocal is None:
        return None
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------------------------------------------------
# HEALTH ENDPOINT – always works
# ------------------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "Web3 Deal Sourcing & Market Intelligence Platform",
        "status": "running",
        "database_available": database is not None and database.SessionLocal is not None,
        "mongodb_available": database is not None and hasattr(database, 'mongo_db') and database.mongo_db is not None
    }

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": asyncio.get_event_loop().time()}

# ------------------------------------------------------------
# Projects endpoints (only if models and database exist)
# ------------------------------------------------------------
if models is not None and database is not None and schemas is not None:
    @app.get("/projects", response_model=list[schemas.ProjectOut])
    def get_projects(skip: int = 0, limit: int = 100, stage: str = None, sector: str = None, db: Session = Depends(get_db)):
        if db is None:
            return []
        query = db.query(models.Project)
        if stage:
            query = query.filter(models.Project.stage == stage)
        if sector:
            query = query.filter(models.Project.sector == sector)
        return query.offset(skip).limit(limit).all()

    @app.get("/projects/{project_id}")
    def get_project(project_id: int, db: Session = Depends(get_db)):
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project

    # Additional endpoints (refresh, discover) can be added similarly
else:
    print("WARNING: Projects endpoints disabled because models/database not available")

# ------------------------------------------------------------
# WebSocket (safe)
# ------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)