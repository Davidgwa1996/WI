from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import asyncio
import os

from app import models, database, schemas
from app.scrapers import (
    twitter, github, discord, coingecko, defillama,
    angellist, crunchbase, producthunt
)
from app.ai import llm_analyzer, sentiment, momentum, funding_predictor, ensemble
from app.analytics import monte_carlo, anomaly_detection
from app.websocket_manager import manager

app = FastAPI(title="Web3 Deal Sourcing & Market Intelligence")

# CORS Middleware - Allow all origins for Railway
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Railway deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    if database.SessionLocal is None:
        return None
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "message": "Web3 Deal Sourcing & Market Intelligence Platform",
        "status": "running",
        "database_available": database.SessionLocal is not None,
        "mongodb_available": database.mongo_db is not None
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected" if database.SessionLocal is not None else "disconnected",
        "mongodb": "connected" if database.mongo_db is not None else "disconnected"
    }

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

@app.post("/projects/refresh/{project_id}")
def refresh_project(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404)

    background_tasks.add_task(twitter.update_twitter_metrics, project, db)
    background_tasks.add_task(github.update_github_metrics, project, db)
    background_tasks.add_task(discord.update_discord_metrics, project, db)
    background_tasks.add_task(coingecko.update_market_data, project, db)
    background_tasks.add_task(defillama.update_defillama_tvl, project, db)
    background_tasks.add_task(run_ai_analysis, project, db)

    return {"message": "Refresh started"}

@app.post("/projects/discover")
def discover_new_projects(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    sources = [
        angellist.scrape_angellist_startups,
        crunchbase.get_crunchbase_early_stage,
        producthunt.get_producthunt_web3
    ]

    for source in sources:
        startups = source()
        for startup in startups:
            existing = db.query(models.Project).filter(models.Project.name == startup["name"]).first()
            if not existing:
                project = models.Project(
                    name=startup["name"],
                    description=startup.get("description", ""),
                    stage=startup.get("stage", "seed"),
                    funding_raised=startup.get("funding_raised", 0),
                    website=startup.get("source_url"),
                    extra_data={"source": startup["source"]}
                )
                db.add(project)
                db.commit()
                background_tasks.add_task(run_ai_analysis, project, db)

    return {"message": "Discovery initiated"}

def run_ai_analysis(project, db):
    try:
        project.llm_score = llm_analyzer.llm_early_stage_score(project)
    except Exception as e:
        print(f"LLM error: {e}")
        project.llm_score = 50.0
    
    try:
        project.sentiment_score = sentiment.get_sentiment_score(project.id)
    except Exception as e:
        print(f"Sentiment error: {e}")
        project.sentiment_score = 50.0
    
    try:
        project.momentum_score = momentum.calculate_momentum_score(project)
    except Exception as e:
        print(f"Momentum error: {e}")
        project.momentum_score = 50.0
    
    try:
        project.funding_prediction = funding_predictor.predict_funding(project)
    except Exception as e:
        print(f"Funding prediction error: {e}")
        project.funding_prediction = 50.0
    
    try:
        project.overall_score = ensemble.overall_score(project)
    except Exception as e:
        print(f"Ensemble error: {e}")
        project.overall_score = 50.0

    try:
        monte_carlo_prob = monte_carlo.monte_carlo_funding_probability(project)
        anomaly = anomaly_detection.detect_growth_spike(project)
        project.extra_data['monte_carlo_prob'] = monte_carlo_prob
        project.extra_data['anomaly_detected'] = anomaly
    except Exception as e:
        print(f"Analytics error: {e}")

    db.commit()

    try:
        loop = asyncio.new_event_loop()
        loop.run_until_complete(manager.broadcast({
            "type": "full_update",
            "project_id": project.id,
            "overall_score": project.overall_score,
            "llm_score": project.llm_score,
            "sentiment_score": project.sentiment_score,
            "funding_prediction": project.funding_prediction,
            "momentum_score": project.momentum_score,
            "twitter_followers": project.twitter_followers,
            "github_stars": project.github_stars,
            "discord_members": project.discord_members,
            "market_cap": project.market_cap,
            "monte_carlo_prob": monte_carlo_prob if 'monte_carlo_prob' in locals() else 50,
            "anomaly_detected": anomaly if 'anomaly' in locals() else False
        }))
    except Exception as e:
        print(f"Broadcast error: {e}")

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