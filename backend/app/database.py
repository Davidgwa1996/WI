from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = None
SessionLocal = None
mongo_db = None


def _build_engine():
    if not settings.DATABASE_URL:
        print("Warning: DATABASE_URL is not set")
        return None

    try:
        return create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
            future=True,
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

        mongo_client = MongoClient(settings.MONGODB_URL)
        mongo_db = mongo_client["web3_intel"]
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
        Base.metadata.create_all(bind=engine)