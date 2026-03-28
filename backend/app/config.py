import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Keys
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
    TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
    TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
    TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET")
    DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    CRUNCHBASE_API_KEY = os.getenv("CRUNCHBASE_API_KEY")
    PRODUCTHUNT_API_KEY = os.getenv("PRODUCTHUNT_API_KEY")
    COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

    # Databases
    DATABASE_URL = os.getenv("DATABASE_URL")
    MONGODB_URL = os.getenv("MONGODB_URL")
    REDIS_URL = os.getenv("REDIS_URL")

    # Models
    MODEL_PATH = os.getenv("MODEL_PATH")
    FINBERT_MODEL = os.getenv("FINBERT_MODEL")

settings = Settings()