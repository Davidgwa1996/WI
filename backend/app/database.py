from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = None
SessionLocal = None
mongo_db = None
mongo_client = None


def _normalize_database_url(url: str) -> str:
    if not url:
        return url

    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)

    return url


def _build_engine():
    if not settings.DATABASE_URL:
        print("ERROR: DATABASE_URL is not set")
        return None

    try:
        database_url = _normalize_database_url(settings.DATABASE_URL)

        connect_args = {}
        if database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False

        engine_instance = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            future=True,
            connect_args=connect_args,
        )

        # Test connection immediately
        with engine_instance.connect() as connection:
            connection.execute(text("SELECT 1"))

        print("PostgreSQL engine created successfully")
        return engine_instance

    except Exception as e:
        print(f"ERROR: PostgreSQL engine creation failed: {e}")
        return None


engine = _build_engine()

if engine is not None:
    try:
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
            future=True,
        )
        print("PostgreSQL session factory created successfully")
    except Exception as e:
        print(f"ERROR: PostgreSQL session setup failed: {e}")
        SessionLocal = None
else:
    print("WARNING: SessionLocal not created because engine is unavailable")


if settings.MONGODB_URL:
    try:
        from pymongo import MongoClient

        mongo_client = MongoClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
        )
        mongo_db = mongo_client["web3_intel"]

        try:
            mongo_client.admin.command("ping")
            print("MongoDB connected successfully")
        except Exception as ping_error:
            print(f"WARNING: MongoDB ping failed: {ping_error}")
            mongo_db = None

    except Exception as e:
        print(f"WARNING: MongoDB connection failed: {e}")
        mongo_db = None


def get_db():
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        print(f"Database session error: {e}")
        raise
    finally:
        db.close()


def get_mongo_db():
    return mongo_db


def init_db():
    from app.models import Base

    if engine is None:
        print("WARNING: Database initialization skipped because engine is unavailable")
        return

    try:
        Base.metadata.create_all(bind=engine)
        print("PostgreSQL tables initialized successfully")
    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")