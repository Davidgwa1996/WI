from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import json
import logging

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import Watchlist, WatchlistItem, Project, User, ProjectHistory
from app.schemas import (
    WatchlistCreate, WatchlistUpdate, WatchlistOut, 
    WatchlistItemCreate, WatchlistItemOut, ApiMessage,
    WatchlistActivity, WatchlistChangeDetection
)
from app.services.audit import create_audit_log
from app.websocket_manager import manager

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/watchlists", tags=["watchlists"])

# Store active watchlist connections for real-time updates
active_watchlist_connections: Dict[int, set] = {}  # watchlist_id -> set of websocket connections


# ============================================
# WEBSOCKET FOR REAL-TIME WATCHLIST UPDATES
# ============================================
@router.websocket("/ws/{watchlist_id}")
async def watchlist_websocket(
    websocket: WebSocket,
    watchlist_id: int,
    user_id: int = Depends(get_current_user),
):
    """WebSocket endpoint for real-time watchlist updates."""
    await websocket.accept()
    
    # Track this connection
    if watchlist_id not in active_watchlist_connections:
        active_watchlist_connections[watchlist_id] = set()
    active_watchlist_connections[watchlist_id].add(websocket)
    
    try:
        while True:
            # Receive heartbeat or commands from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
            elif message.get("type") == "subscribe":
                # Subscribe to specific project updates within this watchlist
                project_ids = message.get("project_ids", [])
                # Store subscription preferences if needed
                pass
                
    except WebSocketDisconnect:
        # Remove connection on disconnect
        if watchlist_id in active_watchlist_connections:
            active_watchlist_connections[watchlist_id].discard(websocket)
            if not active_watchlist_connections[watchlist_id]:
                del active_watchlist_connections[watchlist_id]
    except Exception as e:
        logger.error(f"Watchlist WebSocket error: {e}")
        if watchlist_id in active_watchlist_connections:
            active_watchlist_connections[watchlist_id].discard(websocket)


async def broadcast_watchlist_update(watchlist_id: int, update_data: dict):
    """Broadcast real-time updates to all connected clients for a watchlist."""
    if watchlist_id in active_watchlist_connections:
        for connection in active_watchlist_connections[watchlist_id]:
            try:
                await connection.send_json(update_data)
            except Exception as e:
                logger.error(f"Failed to broadcast to watchlist {watchlist_id}: {e}")


# ============================================
# CRUD OPERATIONS
# ============================================
@router.get("/", response_model=list[WatchlistOut])
def list_watchlists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all watchlists for the current user's organization."""
    return (
        db.query(Watchlist)
        .filter(Watchlist.organization_id == current_user.organization_id)
        .order_by(Watchlist.is_default.desc(), Watchlist.created_at.desc())
        .all()
    )


@router.get("/{watchlist_id}", response_model=WatchlistOut)
def get_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific watchlist by ID."""
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return watchlist


@router.post("/", response_model=WatchlistOut)
def create_watchlist(
    payload: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin", "analyst")),
):
    """Create a new watchlist."""
    watchlist = Watchlist(
        organization_id=current_user.organization_id,
        name=payload.name,
        description=payload.description,
        is_default=payload.is_default,
        created_by=current_user.id,
        settings={
            "alert_on_change": payload.alert_on_change if hasattr(payload, 'alert_on_change') else True,
            "alert_threshold": payload.alert_threshold if hasattr(payload, 'alert_threshold') else 5.0,
            "notification_channels": payload.notification_channels if hasattr(payload, 'notification_channels') else ["in_app"],
        }
    )
    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)

    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="watchlist.created",
        target_type="watchlist",
        target_id=str(watchlist.id),
        message=f"Created watchlist '{watchlist.name}'",
    )
    return watchlist


@router.put("/{watchlist_id}", response_model=WatchlistOut)
def update_watchlist(
    watchlist_id: int,
    payload: WatchlistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """Update an existing watchlist."""
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    if payload.name:
        watchlist.name = payload.name
    if payload.description is not None:
        watchlist.description = payload.description
    if payload.is_default is not None:
        watchlist.is_default = payload.is_default
    if payload.settings:
        watchlist.settings = {**watchlist.settings, **payload.settings}
    
    watchlist.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(watchlist)
    
    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="watchlist.updated",
        target_type="watchlist",
        target_id=str(watchlist.id),
        message=f"Updated watchlist '{watchlist.name}'",
    )
    
    return watchlist


@router.delete("/{watchlist_id}", response_model=ApiMessage)
def delete_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """Delete a watchlist (cannot delete default watchlist)."""
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    if watchlist.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default watchlist")
    
    db.delete(watchlist)
    db.commit()
    
    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="watchlist.deleted",
        target_type="watchlist",
        target_id=str(watchlist.id),
        message=f"Deleted watchlist '{watchlist.name}'",
    )
    
    return ApiMessage(message="Watchlist deleted successfully")


# ============================================
# WATCHLIST ITEMS (PROJECTS)
# ============================================
@router.get("/{watchlist_id}/items", response_model=list[WatchlistItemOut])
def get_watchlist_items(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all projects in a watchlist with real-time metrics."""
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    items = (
        db.query(WatchlistItem, Project)
        .join(Project, WatchlistItem.project_id == Project.id)
        .filter(WatchlistItem.watchlist_id == watchlist_id)
        .all()
    )
    
    results = []
    for item, project in items:
        results.append({
            "id": item.id,
            "watchlist_id": item.watchlist_id,
            "project_id": project.id,
            "project_name": project.name,
            "project_description": project.description,
            "project_stage": project.stage,
            "overall_score": project.overall_score,
            "momentum_score": project.momentum_score,
            "sentiment_score": project.sentiment_score,
            "funding_prediction": project.funding_prediction,
            "twitter_followers": project.twitter_followers,
            "github_stars": project.github_stars,
            "discord_members": project.discord_members,
            "market_cap": project.market_cap,
            "note": item.note,
            "tag": item.tag,
            "added_at": item.added_at,
            "last_updated": project.updated_at,
        })
    
    return results


@router.post("/{watchlist_id}/items", response_model=WatchlistItemOut)
def add_watchlist_item(
    watchlist_id: int,
    payload: WatchlistItemCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin", "analyst")),
):
    """Add a project to a watchlist with real-time tracking."""
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = (
        db.query(WatchlistItem)
        .filter(
            WatchlistItem.watchlist_id == watchlist.id,
            WatchlistItem.project_id == project.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Project already in watchlist")

    item = WatchlistItem(
        watchlist_id=watchlist.id,
        project_id=project.id,
        note=payload.note,
        tag=payload.tag,
        added_by=current_user.id,
        added_at=datetime.utcnow(),
    )
    db.add(item)
    
    # Create initial history record
    history = ProjectHistory(
        project_id=project.id,
        overall_score=project.overall_score,
        momentum_score=project.momentum_score,
        sentiment_score=project.sentiment_score,
        twitter_followers=project.twitter_followers,
        github_stars=project.github_stars,
        discord_members=project.discord_members,
        market_cap=project.market_cap,
        recorded_at=datetime.utcnow(),
    )
    db.add(history)
    db.commit()
    db.refresh(item)
    
    # Broadcast real-time update
    background_tasks.add_task(
        broadcast_watchlist_update,
        watchlist_id,
        {
            "type": "project_added",
            "watchlist_id": watchlist_id,
            "project_id": project.id,
            "project_name": project.name,
            "timestamp": datetime.utcnow().isoformat(),
            "added_by": current_user.full_name,
        }
    )

    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="watchlist.item_added",
        target_type="project",
        target_id=str(project.id),
        message=f"Added project '{project.name}' to watchlist '{watchlist.name}'",
    )
    
    return item


@router.delete("/{watchlist_id}/items/{project_id}", response_model=ApiMessage)
def remove_watchlist_item(
    watchlist_id: int,
    project_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin", "analyst")),
):
    """Remove a project from a watchlist."""
    item = (
        db.query(WatchlistItem)
        .join(Watchlist, Watchlist.id == WatchlistItem.watchlist_id)
        .filter(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.project_id == project_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    project = db.query(Project).filter(Project.id == project_id).first()
    
    db.delete(item)
    db.commit()
    
    # Broadcast real-time update
    background_tasks.add_task(
        broadcast_watchlist_update,
        watchlist_id,
        {
            "type": "project_removed",
            "watchlist_id": watchlist_id,
            "project_id": project_id,
            "project_name": project.name if project else "Unknown",
            "timestamp": datetime.utcnow().isoformat(),
            "removed_by": current_user.full_name,
        }
    )
    
    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="watchlist.item_removed",
        target_type="project",
        target_id=str(project_id),
        message=f"Removed project '{project.name}' from watchlist",
    )
    
    return ApiMessage(message="Project removed from watchlist")


# ============================================
# LIVE METRICS & CHANGE DETECTION
# ============================================
@router.get("/{watchlist_id}/live")
def get_watchlist_live_metrics(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get live metrics for all projects in a watchlist."""
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    items = (
        db.query(WatchlistItem, Project)
        .join(Project, WatchlistItem.project_id == Project.id)
        .filter(WatchlistItem.watchlist_id == watchlist_id)
        .all()
    )
    
    live_metrics = []
    for item, project in items:
        # Calculate 24h change if history exists
        yesterday = datetime.utcnow() - timedelta(days=1)
        previous_record = (
            db.query(ProjectHistory)
            .filter(
                ProjectHistory.project_id == project.id,
                ProjectHistory.recorded_at <= yesterday
            )
            .order_by(ProjectHistory.recorded_at.desc())
            .first()
        )
        
        score_change = 0
        if previous_record:
            score_change = project.overall_score - previous_record.overall_score
        
        live_metrics.append({
            "project_id": project.id,
            "project_name": project.name,
            "overall_score": project.overall_score,
            "momentum_score": project.momentum_score,
            "sentiment_score": project.sentiment_score,
            "funding_prediction": project.funding_prediction,
            "twitter_followers": project.twitter_followers,
            "github_stars": project.github_stars,
            "discord_members": project.discord_members,
            "market_cap": project.market_cap,
            "score_change_24h": score_change,
            "trend": "up" if score_change > 2 else "down" if score_change < -2 else "stable",
            "last_updated": project.updated_at.isoformat() if project.updated_at else None,
            "note": item.note,
            "tag": item.tag,
        })
    
    return {
        "watchlist_id": watchlist_id,
        "watchlist_name": watchlist.name,
        "total_projects": len(live_metrics),
        "metrics": live_metrics,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/{watchlist_id}/changes")
def detect_watchlist_changes(
    watchlist_id: int,
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detect significant changes in watchlist projects over time."""
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    items = (
        db.query(WatchlistItem, Project)
        .join(Project, WatchlistItem.project_id == Project.id)
        .filter(WatchlistItem.watchlist_id == watchlist_id)
        .all()
    )
    
    changes = []
    for item, project in items:
        # Get current and previous metrics
        current = project
        previous = (
            db.query(ProjectHistory)
            .filter(
                ProjectHistory.project_id == project.id,
                ProjectHistory.recorded_at >= cutoff_time
            )
            .order_by(ProjectHistory.recorded_at)
            .first()
        )
        
        if previous:
            score_delta = current.overall_score - previous.overall_score
            followers_delta = current.twitter_followers - previous.twitter_followers
            stars_delta = current.github_stars - previous.github_stars
            
            if abs(score_delta) >= 2 or abs(followers_delta) >= 100 or abs(stars_delta) >= 10:
                changes.append({
                    "project_id": project.id,
                    "project_name": project.name,
                    "score_change": round(score_delta, 1),
                    "twitter_change": followers_delta,
                    "github_change": stars_delta,
                    "severity": "high" if abs(score_delta) > 5 else "medium" if abs(score_delta) > 2 else "low",
                    "timestamp": datetime.utcnow().isoformat(),
                })
    
    return {
        "watchlist_id": watchlist_id,
        "watchlist_name": watchlist.name,
        "period_hours": hours,
        "changes_found": len(changes),
        "changes": changes,
    }


@router.get("/{watchlist_id}/alerts")
def get_watchlist_alerts(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get active alerts for watchlist projects."""
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    threshold = watchlist.settings.get("alert_threshold", 5.0)
    
    items = (
        db.query(WatchlistItem, Project)
        .join(Project, WatchlistItem.project_id == Project.id)
        .filter(WatchlistItem.watchlist_id == watchlist_id)
        .all()
    )
    
    alerts = []
    for item, project in items:
        # Check for various alert conditions
        if project.overall_score >= 80:
            alerts.append({
                "project_id": project.id,
                "project_name": project.name,
                "type": "high_conviction",
                "message": f"Project reached {project.overall_score}% conviction score",
                "severity": "info",
                "timestamp": datetime.utcnow().isoformat(),
            })
        elif project.overall_score <= 30:
            alerts.append({
                "project_id": project.id,
                "project_name": project.name,
                "type": "low_conviction",
                "message": f"Project dropped to {project.overall_score}% conviction score",
                "severity": "warning",
                "timestamp": datetime.utcnow().isoformat(),
            })
        
        # Momentum alerts
        if project.momentum_score >= 75:
            alerts.append({
                "project_id": project.id,
                "project_name": project.name,
                "type": "high_momentum",
                "message": f"Strong momentum detected ({project.momentum_score}%)",
                "severity": "info",
                "timestamp": datetime.utcnow().isoformat(),
            })
        
        # Funding prediction alerts
        if project.funding_prediction >= 70:
            alerts.append({
                "project_id": project.id,
                "project_name": project.name,
                "type": "funding_potential",
                "message": f"High funding potential predicted ({project.funding_prediction}%)",
                "severity": "success",
                "timestamp": datetime.utcnow().isoformat(),
            })
    
    return {
        "watchlist_id": watchlist_id,
        "total_alerts": len(alerts),
        "alerts": alerts,
    }


# ============================================
# WATCHLIST SUMMARY & ANALYTICS
# ============================================
@router.get("/summary/all")
def get_all_watchlists_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get summary of all watchlists with aggregated metrics."""
    watchlists = (
        db.query(Watchlist)
        .filter(Watchlist.organization_id == current_user.organization_id)
        .all()
    )
    
    summary = []
    for watchlist in watchlists:
        items_count = db.query(WatchlistItem).filter(
            WatchlistItem.watchlist_id == watchlist.id
        ).count()
        
        # Get average scores of projects in this watchlist
        avg_scores = (
            db.query(
                func.avg(Project.overall_score).label("avg_overall"),
                func.avg(Project.momentum_score).label("avg_momentum"),
                func.avg(Project.sentiment_score).label("avg_sentiment"),
            )
            .join(WatchlistItem, WatchlistItem.project_id == Project.id)
            .filter(WatchlistItem.watchlist_id == watchlist.id)
            .first()
        )
        
        summary.append({
            "id": watchlist.id,
            "name": watchlist.name,
            "description": watchlist.description,
            "is_default": watchlist.is_default,
            "projects_count": items_count,
            "avg_overall_score": round(avg_scores.avg_overall, 1) if avg_scores.avg_overall else 0,
            "avg_momentum_score": round(avg_scores.avg_momentum, 1) if avg_scores.avg_momentum else 0,
            "avg_sentiment_score": round(avg_scores.avg_sentiment, 1) if avg_scores.avg_sentiment else 0,
            "created_at": watchlist.created_at.isoformat() if watchlist.created_at else None,
        })
    
    return summary


# ============================================
# BACKGROUND TASK: MONITOR WATCHLISTS FOR CHANGES
# ============================================
async def monitor_watchlist_changes():
    """Background task that continuously monitors watchlists for changes."""
    from app.database import SessionLocal
    
    while True:
        try:
            db = SessionLocal()
            
            # Get all watchlists with alert_on_change enabled
            watchlists = db.query(Watchlist).filter(
                Watchlist.settings['alert_on_change'].astext.cast(db.Boolean) == True
            ).all()
            
            for watchlist in watchlists:
                # Check for recent changes in watchlist projects
                items = db.query(WatchlistItem).filter(
                    WatchlistItem.watchlist_id == watchlist.id
                ).all()
                
                for item in items:
                    project = db.query(Project).filter(Project.id == item.project_id).first()
                    if project and project.updated_at:
                        # Check if updated in last 5 minutes
                        if project.updated_at > datetime.utcnow() - timedelta(minutes=5):
                            await broadcast_watchlist_update(
                                watchlist.id,
                                {
                                    "type": "project_updated",
                                    "watchlist_id": watchlist.id,
                                    "project_id": project.id,
                                    "project_name": project.name,
                                    "overall_score": project.overall_score,
                                    "momentum_score": project.momentum_score,
                                    "timestamp": datetime.utcnow().isoformat(),
                                }
                            )
            
            db.close()
            
        except Exception as e:
            logger.error(f"Watchlist monitor error: {e}")
        
        # Wait before next scan
        await asyncio.sleep(60)  # Scan every minute