from __future__ import annotations

import logging
from threading import Lock
from typing import Optional

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

engine = None
SessionLocal = None
mongo_db = None
mongo_client = None

_engine_lock = Lock()
_mongo_lock = Lock()


def _normalize_database_url(url: str) -> str:
    """Normalize database URL for SQLAlchemy compatibility."""
    if not url:
        return url
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _create_engine_instance():
    """Create a SQLAlchemy engine with safe production defaults."""
    if not settings.DATABASE_URL:
        logger.warning("DATABASE_URL is not set")
        return None

    database_url = _normalize_database_url(settings.DATABASE_URL)
    connect_args = {}

    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    elif database_url.startswith("postgresql"):
        connect_args["connect_timeout"] = 5
        # Uncomment only if your Railway/Postgres setup requires SSL:
        # connect_args["sslmode"] = "require"

    engine_instance = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_recycle=300,
        future=True,
        connect_args=connect_args,
    )
    return engine_instance


def get_engine():
    """Lazily create and cache the SQLAlchemy engine."""
    global engine

    if engine is not None:
        return engine

    with _engine_lock:
        if engine is not None:
            return engine

        try:
            engine = _create_engine_instance()
            if engine is None:
                return None

            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))

            logger.info("PostgreSQL engine created successfully")
            return engine
        except Exception as e:
            logger.error(f"Failed to create PostgreSQL engine: {e}")
            engine = None
            return None


def get_session_factory():
    """Lazily create and cache the SQLAlchemy session factory."""
    global SessionLocal

    if SessionLocal is not None:
        return SessionLocal

    db_engine = get_engine()
    if db_engine is None:
        return None

    try:
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=db_engine,
            future=True,
        )
        logger.info("PostgreSQL session factory created successfully")
        return SessionLocal
    except Exception as e:
        logger.error(f"Failed to create session factory: {e}")
        SessionLocal = None
        return None


def _ensure_missing_columns():
    """
    Add missing columns to existing tables for schema evolution.

    Note:
    This does not rewrite existing foreign-key constraints.
    If you changed ON DELETE behavior in models.py, you still need
    a real migration for already-existing tables.
    """
    db_engine = get_engine()
    if db_engine is None:
        logger.warning("Skipping schema patching because engine is unavailable")
        return

    try:
        inspector = inspect(db_engine)

        with db_engine.connect() as conn:
            # Watchlists table
            if "watchlists" in inspector.get_table_names():
                columns = [col["name"] for col in inspector.get_columns("watchlists")]

                if "created_by" not in columns:
                    logger.info("Adding missing column: watchlists.created_by")
                    conn.execute(text(
                        "ALTER TABLE watchlists "
                        "ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)"
                    ))

                if "settings" not in columns:
                    logger.info("Adding missing column: watchlists.settings")
                    conn.execute(text(
                        "ALTER TABLE watchlists "
                        "ADD COLUMN IF NOT EXISTS settings JSONB "
                        "DEFAULT '{\"alert_on_change\": true, "
                        "\"alert_threshold\": 5.0, "
                        "\"notification_channels\": [\"in_app\"]}'"
                    ))

                conn.commit()

            # Projects table
            if "projects" in inspector.get_table_names():
                project_columns = [col["name"] for col in inspector.get_columns("projects")]

                if "is_featured" not in project_columns:
                    logger.info("Adding missing column: projects.is_featured")
                    conn.execute(text(
                        "ALTER TABLE projects "
                        "ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE"
                    ))

                if "anomaly_score" not in project_columns:
                    logger.info("Adding missing column: projects.anomaly_score")
                    conn.execute(text(
                        "ALTER TABLE projects "
                        "ADD COLUMN IF NOT EXISTS anomaly_score FLOAT DEFAULT 0.0"
                    ))

                conn.commit()

            # Project history
            if "project_history" in inspector.get_table_names():
                history_columns = [col["name"] for col in inspector.get_columns("project_history")]

                if "trigger_source" not in history_columns:
                    logger.info("Adding missing column: project_history.trigger_source")
                    conn.execute(text(
                        "ALTER TABLE project_history "
                        "ADD COLUMN IF NOT EXISTS trigger_source VARCHAR(50) DEFAULT 'scraper'"
                    ))
                    conn.commit()

            # Team invites
            if "team_invites" in inspector.get_table_names():
                invite_columns = [col["name"] for col in inspector.get_columns("team_invites")]

                if "accepted_at" not in invite_columns:
                    logger.info("Adding missing column: team_invites.accepted_at")
                    conn.execute(text(
                        "ALTER TABLE team_invites "
                        "ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP"
                    ))
                    conn.commit()

    except Exception as e:
        logger.warning(f"Could not ensure missing columns: {e}")


def init_db():
    """
    Initialize database tables and ensure schema is up to date.

    This creates missing tables from SQLAlchemy metadata.
    It does not alter existing FK constraints for old tables.
    """
    db_engine = get_engine()
    if db_engine is None:
        logger.warning("Database initialization skipped because engine is unavailable")
        return

    try:
        from app.models import Base

        Base.metadata.create_all(bind=db_engine)
        logger.info("PostgreSQL tables initialized successfully")

        _ensure_missing_columns()
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


def get_db():
    """Dependency to get a database session."""
    session_factory = get_session_factory()
    if session_factory is None:
        logger.warning("Database session factory not available")
        yield None
        return

    db = session_factory()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        db.close()


def init_mongo():
    """Initialize MongoDB lazily. Optional service."""
    global mongo_client, mongo_db

    if mongo_client is not None and mongo_db is not None:
        return mongo_db

    if not settings.MONGODB_URL:
        logger.info("MONGODB_URL not set. MongoDB features disabled.")
        return None

    with _mongo_lock:
        if mongo_client is not None and mongo_db is not None:
            return mongo_db

        try:
            from pymongo import MongoClient
            from urllib.parse import urlparse

            mongo_client = MongoClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=5000,
            )

            parsed_url = urlparse(settings.MONGODB_URL)
            db_name = parsed_url.path.lstrip("/") or "web3_intel"
            mongo_db = mongo_client[db_name]

            mongo_client.admin.command("ping")
            logger.info(f"MongoDB connected successfully to database: {db_name}")
            return mongo_db

        except ImportError:
            logger.warning("pymongo not installed. MongoDB features disabled.")
            mongo_client = None
            mongo_db = None
            return None
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}")
            mongo_client = None
            mongo_db = None
            return None


def get_mongo_db():
    """Get MongoDB database instance."""
    return init_mongo()


def check_db_connection() -> bool:
    """Check if database connection is healthy."""
    db_engine = get_engine()
    if db_engine is None:
        return False

    try:
        with db_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False


def get_db_status() -> dict:
    """Get detailed database status for health checks."""
    db_engine = get_engine()
    mongo = get_mongo_db()

    status = {
        "postgresql": {
            "connected": False,
            "engine_available": db_engine is not None,
            "session_available": get_session_factory() is not None,
        },
        "mongodb": {
            "connected": False,
            "client_available": mongo_client is not None,
            "db_available": mongo is not None,
        },
    }

    if db_engine is not None:
        try:
            with db_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            status["postgresql"]["connected"] = True
        except Exception:
            pass

    if mongo_client is not None:
        try:
            mongo_client.admin.command("ping")
            status["mongodb"]["connected"] = True
        except Exception:
            pass

    return status