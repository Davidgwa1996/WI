from __future__ import annotations

import time
import logging
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)

engine = None
SessionLocal = None
mongo_db = None
mongo_client = None


def _normalize_database_url(url: str) -> str:
    """Normalize database URL for SQLAlchemy compatibility."""
    if not url:
        return url
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _retry_call(func, max_attempts=3, delay=2, *args, **kwargs):
    """Retry a function call with exponential backoff."""
    last_exception = None
    for attempt in range(1, max_attempts + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            last_exception = e
            logger.warning(f"Attempt {attempt}/{max_attempts} failed: {e}")
            if attempt < max_attempts:
                time.sleep(delay * attempt)  # linear backoff
    raise last_exception


def _build_engine():
    """Create and test database engine with retries."""
    if not settings.DATABASE_URL:
        logger.error("DATABASE_URL is not set in environment variables")
        return None

    def _create():
        database_url = _normalize_database_url(settings.DATABASE_URL)
        connect_args = {}
        if database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False

        engine_instance = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=10,
            max_overflow=20,
            future=True,
            connect_args=connect_args,
        )
        # Test connection
        with engine_instance.connect() as conn:
            conn.execute(text("SELECT 1"))
        return engine_instance

    try:
        engine_instance = _retry_call(_create, max_attempts=5, delay=2)
        logger.info("PostgreSQL engine created successfully")
        return engine_instance
    except Exception as e:
        logger.error(f"PostgreSQL engine creation failed after retries: {e}")
        return None


def _ensure_missing_columns():
    """Add missing columns to existing tables (for schema evolution)."""
    if engine is None:
        return
    try:
        inspector = inspect(engine)
        with engine.connect() as conn:
            # Watchlists table
            if "watchlists" in inspector.get_table_names():
                columns = [col["name"] for col in inspector.get_columns("watchlists")]
                if "created_by" not in columns:
                    logger.info("Adding missing column: watchlists.created_by")
                    conn.execute(text(
                        "ALTER TABLE watchlists ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)"
                    ))
                if "settings" not in columns:
                    logger.info("Adding missing column: watchlists.settings")
                    conn.execute(text(
                        "ALTER TABLE watchlists ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{\"alert_on_change\": true, \"alert_threshold\": 5.0, \"notification_channels\": [\"in_app\"]}'"
                    ))
                conn.commit()

            # Projects table
            if "projects" in inspector.get_table_names():
                project_columns = [col["name"] for col in inspector.get_columns("projects")]
                if "is_featured" not in project_columns:
                    logger.info("Adding missing column: projects.is_featured")
                    conn.execute(text(
                        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE"
                    ))
                if "anomaly_score" not in project_columns:
                    logger.info("Adding missing column: projects.anomaly_score")
                    conn.execute(text(
                        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS anomaly_score FLOAT DEFAULT 0.0"
                    ))
                conn.commit()

            # Project history
            if "project_history" in inspector.get_table_names():
                history_columns = [col["name"] for col in inspector.get_columns("project_history")]
                if "trigger_source" not in history_columns:
                    logger.info("Adding missing column: project_history.trigger_source")
                    conn.execute(text(
                        "ALTER TABLE project_history ADD COLUMN IF NOT EXISTS trigger_source VARCHAR(50) DEFAULT 'scraper'"
                    ))
                    conn.commit()

            # Team invites
            if "team_invites" in inspector.get_table_names():
                invite_columns = [col["name"] for col in inspector.get_columns("team_invites")]
                if "accepted_at" not in invite_columns:
                    logger.info("Adding missing column: team_invites.accepted_at")
                    conn.execute(text(
                        "ALTER TABLE team_invites ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP"
                    ))
                    conn.commit()

    except Exception as e:
        logger.warning(f"Could not ensure missing columns: {e}")


# Create engine (with retries)
engine = _build_engine()

if engine is not None:
    try:
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
            future=True,
        )
        logger.info("PostgreSQL session factory created successfully")
        _ensure_missing_columns()
    except Exception as e:
        logger.error(f"PostgreSQL session setup failed: {e}")
        SessionLocal = None
else:
    logger.warning("SessionLocal not created because engine is unavailable")


# MongoDB connection (no retry – optional)
if settings.MONGODB_URL:
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
    except ImportError:
        logger.warning("pymongo not installed. MongoDB features disabled.")
        mongo_db = None
        mongo_client = None
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e}")
        mongo_db = None
        mongo_client = None
else:
    logger.info("MONGODB_URL not set. MongoDB features disabled.")


def get_db():
    """Dependency to get database session."""
    if SessionLocal is None:
        logger.error("Database session factory not available")
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        db.close()


def get_mongo_db():
    """Get MongoDB database instance."""
    return mongo_db


def init_db():
    """Initialize database tables and ensure schema is up to date (with retries)."""
    if engine is None:
        logger.warning("Database initialization skipped because engine is unavailable")
        return

    def _init():
        from app.models import Base
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL tables initialized successfully")
        _ensure_missing_columns()

    try:
        _retry_call(_init, max_attempts=5, delay=2)
    except Exception as e:
        logger.error(f"Database initialization failed after retries: {e}")
        raise


def check_db_connection() -> bool:
    """Check if database connection is healthy."""
    if engine is None:
        return False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False


def get_db_status() -> dict:
    """Get detailed database status for health checks."""
    status = {
        "postgresql": {
            "connected": False,
            "engine_available": engine is not None,
            "session_available": SessionLocal is not None,
        },
        "mongodb": {
            "connected": False,
            "client_available": mongo_client is not None,
            "db_available": mongo_db is not None,
        }
    }
    if engine is not None:
        try:
            with engine.connect() as conn:
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