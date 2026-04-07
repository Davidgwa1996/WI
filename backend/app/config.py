import os
from dotenv import load_dotenv

load_dotenv()


def _to_list(value: str | None, default: str = "") -> list[str]:
    raw = value if value is not None else default
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    APP_NAME = os.getenv("APP_NAME", "Web3 Intel Platform")
    APP_ENV = os.getenv("APP_ENV", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    API_PREFIX = os.getenv("API_PREFIX", "/api/v1")
    PORT = int(os.getenv("PORT", "8000"))

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    FRONTEND_ORIGINS = _to_list(
        os.getenv("FRONTEND_ORIGINS"),
        default="http://localhost:5173,http://127.0.0.1:5173"
    )
    WS_PATH = os.getenv("WS_PATH", "/ws")

    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
    TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
    TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
    TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET")
    DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

    GOOGLE_SEARCH_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")
    GOOGLE_SEARCH_ENGINE_ID = os.getenv("GOOGLE_SEARCH_ENGINE_ID")

    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")

    DATABASE_URL = os.getenv("DATABASE_URL", "")
    MONGODB_URL = os.getenv("MONGODB_URL", "")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    MODEL_PATH = os.getenv("MODEL_PATH", "models/funding_predictor.pkl")
    FINBERT_MODEL = os.getenv("FINBERT_MODEL", "ProsusAI/finbert")

    ENABLE_REDIS = os.getenv("ENABLE_REDIS", "true").lower() == "true"
    ENABLE_WEBSOCKETS = os.getenv("ENABLE_WEBSOCKETS", "true").lower() == "true"
    ENABLE_AI = os.getenv("ENABLE_AI", "true").lower() == "true"
    ENABLE_SCRAPERS = os.getenv("ENABLE_SCRAPERS", "true").lower() == "true"

    def as_dict(self) -> dict:
        return {
            "APP_NAME": self.APP_NAME,
            "APP_ENV": self.APP_ENV,
            "DEBUG": self.DEBUG,
            "API_PREFIX": self.API_PREFIX,
            "PORT": self.PORT,
            "FRONTEND_URL": self.FRONTEND_URL,
            "FRONTEND_ORIGINS": self.FRONTEND_ORIGINS,
            "WS_PATH": self.WS_PATH,
            "DATABASE_URL_SET": bool(self.DATABASE_URL),
            "MONGODB_URL_SET": bool(self.MONGODB_URL),
            "REDIS_URL_SET": bool(self.REDIS_URL),
            "OPENAI_API_KEY_SET": bool(self.OPENAI_API_KEY),
            "GITHUB_TOKEN_SET": bool(self.GITHUB_TOKEN),
            "TWITTER_BEARER_TOKEN_SET": bool(self.TWITTER_BEARER_TOKEN),
            "STRIPE_SECRET_KEY_SET": bool(self.STRIPE_SECRET_KEY),
            "GOOGLE_SEARCH_API_KEY_SET": bool(self.GOOGLE_SEARCH_API_KEY),
            "ENABLE_REDIS": self.ENABLE_REDIS,
            "ENABLE_WEBSOCKETS": self.ENABLE_WEBSOCKETS,
            "ENABLE_AI": self.ENABLE_AI,
            "ENABLE_SCRAPERS": self.ENABLE_SCRAPERS,
        }


settings = Settings()