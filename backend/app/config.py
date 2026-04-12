from __future__ import annotations

import json
import logging
import os
from typing import List

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def _to_bool(value: str | None, default: str = "false") -> bool:
    raw = value if value is not None else default
    return raw.strip().lower() in ("true", "1", "yes", "on")


def _to_int(value: str | None, default: str = "0") -> int:
    raw = value if value is not None else default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return int(default)


def _to_list(value: str | None, default: str = "") -> List[str]:
    raw = value if value is not None else default

    if not raw:
        return []

    raw = raw.strip()

    if raw.startswith("[") and raw.endswith("]"):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except Exception:
            pass

    return [item.strip() for item in raw.split(",") if item.strip()]


def _validate_https_url(url: str, name: str, environment: str) -> bool:
    is_valid = True
    if url and not url.startswith("https://"):
        if environment == "production":
            logger.warning(f"{name} should use HTTPS in production: {url}")
            is_valid = False
    return is_valid


class Settings:
    # ============================================
    # BASIC APP CONFIGURATION
    # ============================================
    APP_NAME = os.getenv("APP_NAME", "Web3 Intel Platform")
    APP_ENV = os.getenv("APP_ENV", "development")
    DEBUG = _to_bool(os.getenv("DEBUG"), "false")

    # ============================================
    # API / SERVER
    # ============================================
    API_PREFIX = os.getenv("API_PREFIX", "/api/v1")
    PORT = _to_int(os.getenv("PORT"), "8000")
    HOST = os.getenv("HOST", "0.0.0.0")

    # Docs visibility
    # Set ENABLE_DOCS=true in production if you want /docs, /redoc and openapi enabled
    ENABLE_DOCS = _to_bool(os.getenv("ENABLE_DOCS"), "true")

    # ============================================
    # PRODUCT ACCESS MODEL
    # ============================================
    PUBLIC_DEMO_MODE = _to_bool(os.getenv("PUBLIC_DEMO_MODE"), "true")
    ALLOW_PUBLIC_SIGNUP = _to_bool(os.getenv("ALLOW_PUBLIC_SIGNUP"), "true")
    ALLOW_SELF_DELETE = _to_bool(os.getenv("ALLOW_SELF_DELETE"), "true")

    # ============================================
    # OWNER / ADMIN RULES
    # ============================================
    OWNER_EMAIL = os.getenv("OWNER_EMAIL", "davidmaina@gmail.com").strip().lower()

    ADMIN_EMAILS = [
        email.strip().lower()
        for email in _to_list(os.getenv("ADMIN_EMAILS"), default=OWNER_EMAIL)
        if email.strip()
    ]

    if OWNER_EMAIL and OWNER_EMAIL not in ADMIN_EMAILS:
        ADMIN_EMAILS.append(OWNER_EMAIL)

    ADMIN_EMAILS = list(dict.fromkeys(ADMIN_EMAILS))

    # ============================================
    # FRONTEND / CORS
    # ============================================
    FRONTEND_URL = os.getenv("FRONTEND_URL", "https://web3dkintel.netlify.app")
    NETLIFY_URL = "https://web3dkintel.netlify.app"

    DEFAULT_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://web3dkintel.netlify.app",
    ]

    FRONTEND_ORIGINS = _to_list(
        os.getenv("FRONTEND_ORIGINS"),
        default=",".join(DEFAULT_ORIGINS),
    )

    if NETLIFY_URL not in FRONTEND_ORIGINS:
        FRONTEND_ORIGINS.append(NETLIFY_URL)

    if FRONTEND_URL and FRONTEND_URL not in FRONTEND_ORIGINS:
        FRONTEND_ORIGINS.append(FRONTEND_URL)

    FRONTEND_ORIGINS = list(dict.fromkeys(FRONTEND_ORIGINS))

    if APP_ENV == "production":
        _validate_https_url(FRONTEND_URL, "FRONTEND_URL", APP_ENV)
        for origin in FRONTEND_ORIGINS:
            if (
                origin.startswith("http://")
                and "localhost" not in origin
                and "127.0.0.1" not in origin
            ):
                logger.warning(
                    f"FRONTEND_ORIGINS contains insecure HTTP origin (non-localhost): {origin}"
                )

    # ============================================
    # WEBSOCKET
    # ============================================
    WS_PATH = os.getenv("WS_PATH", "/ws")
    WS_HEARTBEAT_INTERVAL = _to_int(os.getenv("WS_HEARTBEAT_INTERVAL"), "30")

    # ============================================
    # AUTH / SECURITY
    # ============================================
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = _to_int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"), "1440"
    )
    REFRESH_TOKEN_EXPIRE_DAYS = _to_int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"), "7"
    )

    # ============================================
    # INVITES
    # ============================================
    INVITE_EXPIRY_HOURS = _to_int(os.getenv("INVITE_EXPIRY_HOURS"), "72")

    # ============================================
    # SCRAPER / EXTERNAL APIS
    # ============================================
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
    TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
    TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
    TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET")

    DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

    # ============================================
    # PAYMENTS
    # ============================================
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

    # ============================================
    # SEARCH
    # ============================================
    GOOGLE_SEARCH_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")
    GOOGLE_SEARCH_ENGINE_ID = os.getenv("GOOGLE_SEARCH_ENGINE_ID")

    # ============================================
    # EMAIL
    # ============================================
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = _to_int(os.getenv("SMTP_PORT"), "587")
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
    SMTP_USE_TLS = _to_bool(os.getenv("SMTP_USE_TLS"), "true")
    SMTP_USE_SSL = _to_bool(os.getenv("SMTP_USE_SSL"), "false")

    EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "resend")
    FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_FROM_EMAIL or "")
    FROM_NAME = os.getenv("FROM_NAME", APP_NAME)
    RESEND_API_KEY = os.getenv("RESEND_API_KEY")

    # ============================================
    # DATABASE / CACHE
    # ============================================
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    MONGODB_URL = os.getenv("MONGODB_URL", "")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ============================================
    # AI / MODELS
    # ============================================
    MODEL_PATH = os.getenv("MODEL_PATH", "models/funding_predictor.pkl")
    FINBERT_MODEL = os.getenv("FINBERT_MODEL", "ProsusAI/finbert")
    ENABLE_AI = _to_bool(os.getenv("ENABLE_AI"), "true")

    # ============================================
    # SCRAPERS
    # ============================================
    ENABLE_SCRAPERS = _to_bool(os.getenv("ENABLE_SCRAPERS"), "true")
    SCRAPER_INTERVAL_MINUTES = _to_int(
        os.getenv("SCRAPER_INTERVAL_MINUTES"), "60"
    )

    # ============================================
    # REDIS / WEBSOCKETS
    # ============================================
    ENABLE_REDIS = _to_bool(os.getenv("ENABLE_REDIS"), "true")
    ENABLE_WEBSOCKETS = _to_bool(os.getenv("ENABLE_WEBSOCKETS"), "true")

    # ============================================
    # CELERY
    # ============================================
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

    # ============================================
    # RATE LIMITING
    # ============================================
    RATE_LIMIT_ENABLED = _to_bool(os.getenv("RATE_LIMIT_ENABLED"), "true")
    RATE_LIMIT_REQUESTS = _to_int(os.getenv("RATE_LIMIT_REQUESTS"), "100")
    RATE_LIMIT_PERIOD_SECONDS = _to_int(
        os.getenv("RATE_LIMIT_PERIOD_SECONDS"), "60"
    )

    # ============================================
    # LOGGING
    # ============================================
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.getenv("LOG_FORMAT", "json")

    # ============================================
    # HELPERS
    # ============================================
    @classmethod
    def get_frontend_url(cls) -> str:
        url = cls.FRONTEND_URL
        if cls.APP_ENV == "production" and url.startswith("http://"):
            logger.warning(f"FRONTEND_URL uses HTTP in production: {url}")
            url = url.replace("http://", "https://")
        return url.rstrip("/")

    @classmethod
    def get_cors_origins(cls) -> List[str]:
        return cls.FRONTEND_ORIGINS

    @classmethod
    def get_netlify_url(cls) -> str:
        return cls.NETLIFY_URL

    @classmethod
    def is_development(cls) -> bool:
        return cls.APP_ENV == "development"

    @classmethod
    def is_production(cls) -> bool:
        return cls.APP_ENV == "production"

    @classmethod
    def is_owner_email(cls, email: str | None) -> bool:
        return bool(email and email.strip().lower() == cls.OWNER_EMAIL)

    @classmethod
    def is_super_admin_email(cls, email: str | None) -> bool:
        return bool(email and email.strip().lower() in cls.ADMIN_EMAILS)

    @classmethod
    def validate_config(cls) -> dict:
        issues = []
        warnings = []

        if not cls.FRONTEND_URL:
            issues.append("FRONTEND_URL is not set")
        elif cls.is_production() and not cls.FRONTEND_URL.startswith("https://"):
            issues.append(
                f"FRONTEND_URL must use HTTPS in production: {cls.FRONTEND_URL}"
            )

        if cls.SECRET_KEY == "change-this-in-production" and cls.is_production():
            warnings.append("SECRET_KEY is using default value - change this in production!")

        if not cls.DATABASE_URL and cls.is_production():
            issues.append("DATABASE_URL is not set in production")

        if cls.SMTP_HOST and not cls.SMTP_FROM_EMAIL and not cls.FROM_EMAIL:
            warnings.append("SMTP_HOST is set but no sender email is configured")

        if cls.is_production():
            if not cls.OPENAI_API_KEY:
                warnings.append("OPENAI_API_KEY is not set - AI features will be limited")
            if not cls.TWITTER_BEARER_TOKEN:
                warnings.append("TWITTER_BEARER_TOKEN is not set - Twitter scraping will be limited")

        if not cls.OWNER_EMAIL:
            issues.append("OWNER_EMAIL is not set")

        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "environment": cls.APP_ENV,
            "frontend_url": cls.FRONTEND_URL,
            "frontend_origins": cls.FRONTEND_ORIGINS,
            "frontend_origins_count": len(cls.FRONTEND_ORIGINS),
            "netlify_url": cls.NETLIFY_URL,
            "public_demo_mode": cls.PUBLIC_DEMO_MODE,
            "allow_public_signup": cls.ALLOW_PUBLIC_SIGNUP,
            "allow_self_delete": cls.ALLOW_SELF_DELETE,
            "owner_email": cls.OWNER_EMAIL,
            "admin_emails": cls.ADMIN_EMAILS,
            "enable_docs": cls.ENABLE_DOCS,
        }

    def as_dict(self) -> dict:
        return {
            "APP_NAME": self.APP_NAME,
            "APP_ENV": self.APP_ENV,
            "DEBUG": self.DEBUG,
            "ENABLE_DOCS": self.ENABLE_DOCS,
            "API_PREFIX": self.API_PREFIX,
            "PORT": self.PORT,
            "HOST": self.HOST,
            "FRONTEND_URL": self.FRONTEND_URL,
            "NETLIFY_URL": self.NETLIFY_URL,
            "FRONTEND_ORIGINS": self.FRONTEND_ORIGINS,
            "INVITE_EXPIRY_HOURS": self.INVITE_EXPIRY_HOURS,
            "WS_PATH": self.WS_PATH,
            "ENABLE_WEBSOCKETS": self.ENABLE_WEBSOCKETS,
            "DATABASE_URL_SET": bool(self.DATABASE_URL),
            "MONGODB_URL_SET": bool(self.MONGODB_URL),
            "REDIS_URL_SET": bool(self.REDIS_URL),
            "ENABLE_REDIS": self.ENABLE_REDIS,
            "OPENAI_API_KEY_SET": bool(self.OPENAI_API_KEY),
            "GITHUB_TOKEN_SET": bool(self.GITHUB_TOKEN),
            "TWITTER_BEARER_TOKEN_SET": bool(self.TWITTER_BEARER_TOKEN),
            "COINGECKO_API_KEY_SET": bool(self.COINGECKO_API_KEY),
            "DISCORD_BOT_TOKEN_SET": bool(self.DISCORD_BOT_TOKEN),
            "STRIPE_SECRET_KEY_SET": bool(self.STRIPE_SECRET_KEY),
            "GOOGLE_SEARCH_API_KEY_SET": bool(self.GOOGLE_SEARCH_API_KEY),
            "SMTP_HOST_SET": bool(self.SMTP_HOST),
            "SMTP_FROM_EMAIL": self.SMTP_FROM_EMAIL,
            "FROM_EMAIL": self.FROM_EMAIL,
            "ENABLE_AI": self.ENABLE_AI,
            "ENABLE_SCRAPERS": self.ENABLE_SCRAPERS,
            "RATE_LIMIT_ENABLED": self.RATE_LIMIT_ENABLED,
            "LOG_LEVEL": self.LOG_LEVEL,
            "PUBLIC_DEMO_MODE": self.PUBLIC_DEMO_MODE,
            "ALLOW_PUBLIC_SIGNUP": self.ALLOW_PUBLIC_SIGNUP,
            "ALLOW_SELF_DELETE": self.ALLOW_SELF_DELETE,
            "OWNER_EMAIL": self.OWNER_EMAIL,
            "ADMIN_EMAILS": self.ADMIN_EMAILS,
        }


settings = Settings()

validation = settings.validate_config()
if validation["warnings"]:
    for warning in validation["warnings"]:
        logger.warning(f"Config warning: {warning}")

if not validation["is_valid"]:
    for issue in validation["issues"]:
        logger.error(f"Config error: {issue}")

logger.info(f"CORS origins configured: {settings.get_cors_origins()}")