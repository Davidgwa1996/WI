from __future__ import annotations

import asyncio
import time
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db, init_db
from app.websocket_manager import manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Optional imports with fallbacks
listen_to_events = None
detect_anomalies = None
update_all_projects = None

try:
    from app.utils.pubsub import listen_to_events
except Exception as e:
    logger.warning(f"Pub/Sub listener not available: {e}")

try:
    from app.analytics.anomaly_stream import detect_anomalies
except Exception as e:
    logger.warning(f"Anomaly stream not available: {e}")

try:
    from app.tasks.scraper_tasks import update_all_projects
except Exception as e:
    logger.warning(f"Celery scraper task not available: {e}")

# Import all routers
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


# ============================================
# LIFESPAN CONTEXT MANAGER (replaces on_event)
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    logger.info("=" * 50)
    logger.info(f"Starting {settings.APP_NAME}...")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info(f"API Prefix: {settings.API_PREFIX}")
    logger.info(f"WebSocket Path: {settings.WS_PATH}")
    logger.info(f"Frontend URL: {settings.get_frontend_url()}")
    logger.info(f"CORS Origins: {settings.get_cors_origins()}")
    logger.info("=" * 50)
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    # Start Redis pub/sub listener
    if settings.ENABLE_REDIS and listen_to_events is not None:
        try:
            asyncio.create_task(listen_to_events())
            logger.info("Redis pub/sub listener started")
        except Exception as e:
            logger.warning(f"Could not start pub/sub listener: {e}")
    
    # Start anomaly detection stream
    if detect_anomalies is not None:
        try:
            asyncio.create_task(detect_anomalies())
            logger.info("Anomaly detection stream started")
        except Exception as e:
            logger.warning(f"Could not start anomaly stream: {e}")
    
    # Validate configuration
    validation = settings.validate_config()
    if validation["warnings"]:
        for warning in validation["warnings"]:
            logger.warning(f"Config warning: {warning}")
    if not validation["is_valid"]:
        for issue in validation["issues"]:
            logger.error(f"Config error: {issue}")
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("Shutting down application...")


# ============================================
# CREATE FASTAPI APP
# ============================================
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    redirect_slashes=False,  # IMPORTANT: Prevents 307 redirects that break CORS
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url=f"{settings.API_PREFIX}/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)


# ============================================
# DIRECT TEST ENDPOINTS (bypass all routers)
# ============================================

@app.get("/ping")
async def ping():
    """Simple test endpoint to verify the app is running."""
    return {"pong": True, "timestamp": time.time()}


@app.get("/api/v1/ping")
async def api_ping():
    """Simple test endpoint to verify API prefix works."""
    return {"pong": True, "timestamp": time.time()}


@app.post("/test/create-invite")
async def test_create_invite(
    email: str,
    db: Session = Depends(get_db),
):
    """Test endpoint to create an invite directly (bypasses invites router)."""
    from app.services.invites import create_team_invite
    
    if db is None:
        return {"error": "Database not available"}
    
    try:
        # Get first organization and user for testing
        from app.models import Organization, User
        
        org = db.query(Organization).first()
        user = db.query(User).first()
        
        if not org or not user:
            return {"error": f"No organization or user found. Org: {org is not None}, User: {user is not None}"}
        
        invite, invite_link = create_team_invite(
            db=db,
            organization_id=org.id,
            invited_by_user_id=user.id,
            email=email,
            role="viewer",
        )
        
        return {
            "success": True,
            "invite_id": invite.id,
            "invite_link": invite_link,
            "token": invite.token,
            "email": invite.email,
            "role": invite.role,
            "organization_id": invite.organization_id,
            "expires_at": invite.expires_at.isoformat(),
        }
    except Exception as e:
        logger.error(f"Test create invite failed: {e}")
        return {"error": str(e)}


@app.get("/test/send-email")
async def test_send_email(
    email: str,
    db: Session = Depends(get_db),
):
    """
    Test endpoint to send an email directly.
    Use this to debug email configuration.
    Example: /test/send-email?email=test@example.com
    """
    from app.services.email import send_invite_email
    from app.models import Organization, User
    
    if db is None:
        return {"error": "Database not available"}
    
    # Get first organization and user for context
    org = db.query(Organization).first()
    user = db.query(User).first()
    
    if not org or not user:
        return {"error": "No organization or user found for email context"}
    
    # Create a test invite link
    test_link = f"{settings.get_frontend_url()}/invite/test-token-123"
    
    result = send_invite_email(
        email=email,
        invite_link=test_link,
        role="viewer",
        invited_by=user.full_name,
        organization_name=org.name,
        expires_hours=72
    )
    
    return {
        "success": result,
        "email": email,
        "from_email": settings.SMTP_FROM_EMAIL or os.getenv("FROM_EMAIL"),
        "provider": os.getenv("EMAIL_PROVIDER", "not set"),
        "frontend_url": settings.get_frontend_url(),
        "invite_link": test_link
    }


@app.get("/test/db-status")
async def test_db_status(db: Session = Depends(get_db)):
    """Test database connection and show basic info."""
    if db is None:
        return {"error": "Database not available"}
    
    try:
        from app.models import Organization, User, Project
        
        org_count = db.query(Organization).count()
        user_count = db.query(User).count()
        project_count = db.query(Project).count()
        
        return {
            "success": True,
            "database_connected": True,
            "organizations": org_count,
            "users": user_count,
            "projects": project_count,
        }
    except Exception as e:
        return {"error": str(e)}


# ============================================
# DEBUG ROUTES ENDPOINT
# ============================================
@app.get("/debug/routes")
async def list_all_routes():
    """List all registered routes for debugging."""
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "methods": list(route.methods) if hasattr(route, 'methods') else [],
        })
    return {
        "total": len(routes),
        "routes": routes,
        "invites_router_loaded": any("/invites" in r["path"] for r in routes)
    }


@app.get("/debug/email-config")
async def debug_email_config():
    """Show email configuration (without exposing secrets)."""
    import os
    return {
        "provider": os.getenv("EMAIL_PROVIDER", "not set"),
        "from_email": os.getenv("FROM_EMAIL", "not set"),
        "from_name": os.getenv("FROM_NAME", "not set"),
        "frontend_url": settings.get_frontend_url(),
        "resend_api_key_set": bool(os.getenv("RESEND_API_KEY")),
        "smtp_host_set": bool(os.getenv("SMTP_HOST")),
    }


# ============================================
# CORS MIDDLEWARE (CRITICAL FOR FRONTEND)
# ============================================
# Get allowed origins from settings
allowed_origins = settings.get_cors_origins()

# Ensure Netlify frontend URL is included
netlify_url = "https://web3dkintel.netlify.app"
if netlify_url not in allowed_origins:
    allowed_origins.append(netlify_url)
    logger.info(f"Added {netlify_url} to CORS origins")

logger.info(f"Final CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Accept-Encoding",
        "Authorization",
        "Content-Type",
        "Origin",
        "User-Agent",
        "X-Requested-With",
        "X-CSRF-Token",
    ],
    expose_headers=["Content-Length", "X-Total-Count", "Content-Disposition"],
    max_age=86400,
)


# ============================================
# REQUEST LOGGING MIDDLEWARE
# ============================================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their responses."""
    start_time = time.time()
    logger.info(f"Incoming: {request.method} {request.url.path} from {request.headers.get('origin', 'unknown')}")
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        logger.info(f"Response: {response.status_code} for {request.method} {request.url.path} ({duration:.3f}s)")
        origin = request.headers.get("origin")
        if origin and origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.method} {request.url.path} - {e}")
        raise


# ============================================
# GLOBAL EXCEPTION HANDLER
# ============================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "path": str(request.url.path), "method": request.method})

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} on {request.method} {request.url.path}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


# ============================================
# INCLUDE ALL ROUTERS
# ============================================
app.include_router(auth_router, prefix=settings.API_PREFIX, tags=["Authentication"])
app.include_router(users_router, prefix=settings.API_PREFIX, tags=["Users"])
app.include_router(organizations_router, prefix=settings.API_PREFIX, tags=["Organizations"])
app.include_router(api_keys_router, prefix=settings.API_PREFIX, tags=["API Keys"])
app.include_router(subscriptions_router, prefix=settings.API_PREFIX, tags=["Subscriptions"])
app.include_router(audit_logs_router, prefix=settings.API_PREFIX, tags=["Audit Logs"])
app.include_router(invites_router, prefix=settings.API_PREFIX, tags=["Invites"])
app.include_router(workspace_router, prefix=settings.API_PREFIX, tags=["Workspace"])
app.include_router(billing_router, prefix=settings.API_PREFIX, tags=["Billing"])
app.include_router(watchlists_router, prefix=settings.API_PREFIX, tags=["Watchlists"])
app.include_router(reports_router, prefix=settings.API_PREFIX, tags=["Reports"])
app.include_router(briefings_router, prefix=settings.API_PREFIX, tags=["Briefings"])
app.include_router(search_router, prefix=settings.API_PREFIX, tags=["Search"])
app.include_router(exports_router, prefix=settings.API_PREFIX, tags=["Exports"])
app.include_router(agent_router, prefix=settings.API_PREFIX, tags=["AI Agent"])


# ============================================
# ROOT AND HEALTH ENDPOINTS
# ============================================
@app.get("/")
async def root():
    return {
        "message": settings.APP_NAME,
        "status": "running",
        "version": "1.0.0",
        "api_prefix": settings.API_PREFIX,
        "websocket_path": settings.WS_PATH,
        "environment": settings.APP_ENV,
        "frontend_url": settings.get_frontend_url(),
        "cors_origins": allowed_origins,
    }

@app.get(f"{settings.API_PREFIX}/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time(), "app_name": settings.APP_NAME, "environment": settings.APP_ENV}

@app.get(f"{settings.API_PREFIX}/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    db_status = "connected" if db else "disconnected"
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database": db_status,
        "redis_enabled": settings.ENABLE_REDIS,
        "websockets_enabled": settings.ENABLE_WEBSOCKETS,
        "ai_enabled": settings.ENABLE_AI,
        "scrapers_enabled": settings.ENABLE_SCRAPERS,
    }


# ============================================
# CORS TEST ENDPOINT
# ============================================
@app.options(f"{settings.API_PREFIX}/cors-test")
async def cors_test():
    return {"message": "CORS is working!"}


# ============================================
# PROJECT ENDPOINTS (existing)
# ============================================
@app.get(f"{settings.API_PREFIX}/projects", response_model=list[schemas.ProjectOut])
async def get_projects(skip: int = 0, limit: int = 100, stage: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    if db is None:
        return []
    query = db.query(models.Project)
    if stage:
        query = query.filter(models.Project.stage == stage)
    if sector:
        query = query.filter(models.Project.sector == sector)
    return query.offset(skip).limit(limit).all()

@app.get(f"{settings.API_PREFIX}/projects/summary", response_model=list[schemas.ProjectListItem])
async def get_project_summaries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    if db is None:
        return []
    return db.query(models.Project).offset(skip).limit(limit).all()

@app.get(f"{settings.API_PREFIX}/projects/{{project_id}}", response_model=schemas.ProjectOut)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.post(f"{settings.API_PREFIX}/projects/refresh", response_model=schemas.ApiMessage)
async def refresh_projects():
    if update_all_projects is None:
        raise HTTPException(status_code=503, detail="Refresh worker is not available")
    try:
        update_all_projects.delay()
        return schemas.ApiMessage(message="Project refresh task started")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not start refresh task: {e}")


# ============================================
# METRICS ENDPOINT
# ============================================
@app.get(f"{settings.API_PREFIX}/metrics")
async def get_metrics(db: Session = Depends(get_db)):
    total_projects = 0
    if db is not None:
        try:
            total_projects = db.query(models.Project).count()
        except Exception as e:
            logger.warning(f"Could not count projects: {e}")
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


# ============================================
# WEBSOCKET ENDPOINT
# ============================================
@app.websocket(settings.WS_PATH)
async def websocket_endpoint(websocket: WebSocket):
    if not settings.ENABLE_WEBSOCKETS:
        await websocket.close(code=1008, reason="WebSockets disabled")
        return
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await manager.send_personal_message({"type": "pong", "timestamp": time.time()}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ============================================
# DEBUG ENDPOINT (development only)
# ============================================
if settings.DEBUG:
    @app.get("/debug/config")
    async def debug_config():
        return {
            "frontend_url": settings.get_frontend_url(),
            "cors_origins": settings.get_cors_origins(),
            "environment": settings.APP_ENV,
            "invite_expiry_hours": settings.INVITE_EXPIRY_HOURS,
        }


# ============================================
# MAIN ENTRY POINT
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG, log_level="info")