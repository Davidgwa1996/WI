from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

# PostgreSQL connection
try:
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Warning: PostgreSQL connection failed: {e}")
    engine = None
    SessionLocal = None

# MongoDB connection
try:
    from pymongo import MongoClient
    mongo_client = MongoClient(settings.MONGODB_URL)
    mongo_db = mongo_client["web3_intel"]
except Exception as e:
    print(f"Warning: MongoDB connection failed: {e}")
    mongo_db = None

def get_mongo_db():
    return mongo_db
