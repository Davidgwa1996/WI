from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = None
SessionLocal = None
mongo_db = None
mongo_client = None


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _build_engine():
    if not settings.DATABASE_URL:
        print("Warning: DATABASE_URL is not set")
        return None

    try:
        database_url = _normalize_database_url(settings.DATABASE_URL)

        connect_args = {}
        if database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False

        return create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            future=True,
            connect_args=connect_args,
        )
    except Exception as e:
        print(f"Warning: PostgreSQL engine creation failed: {e}")
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
    except Exception as e:
        print(f"Warning: PostgreSQL session setup failed: {e}")
        SessionLocal = None


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
            print(f"Warning: MongoDB ping failed: {ping_error}")
            mongo_db = None

    except Exception as e:
        print(f"Warning: MongoDB connection failed: {e}")
        mongo_db = None


def get_db():
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_mongo_db():
    return mongo_db


def init_db():
    from app.models import Base

    if engine is not None:
        try:
            Base.metadata.create_all(bind=engine)
            print("PostgreSQL tables initialized successfully")
        except Exception as e:
            print(f"Warning: Database initialization failed: {e}")