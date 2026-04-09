import json
import os
import logging
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)


def _to_bool(value: str | None, default: str = "false") -> bool:
    """Convert string to boolean."""
    raw = value if value is not None else default
    return raw.strip().lower() in ("true", "1", "yes", "on")


def _to_int(value: str | None, default: str = "0") -> int:
    """Convert string to integer with fallback."""
    raw = value if value is not None else default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return int(default)


def _to_list(value: str | None, default: str = "") -> List[str]:
    """
    Convert environment variable to list.
    Supports both JSON array format and comma-separated format.
    
    Examples:
        FRONTEND_ORIGINS=["https://site.com","http://localhost:5173"]
        FRONTEND_ORIGINS=https://site.com,http://localhost:5173
    """
    raw = value if value is not None else default

    if not raw:
        return []

    raw = raw.strip()

    # Support JSON array format
    if raw.startswith("[") and raw.endswith("]"):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except Exception:
            pass

    # Support comma-separated format
    return [item.strip() for item in raw.split(",") if item.strip()]


def _validate_https_url(url: str, name: str) -> bool:
    """Validate that a URL uses HTTPS in production."""
    is_valid = True
    if url and not url.startswith("https://"):
        env = os.getenv("APP_ENV", "development")
        if env == "production":
            logger.warning(f"{name} should use HTTPS in production: {url}")
            is_valid = False
    return is_valid


class Settings:
    """Application settings loaded from environment variables."""
    
    # ============================================
    # BASIC APP CONFIGURATION
    # ============================================
    APP_NAME = os.getenv("APP_NAME", "Web3 Intel Platform")
    APP_ENV = os.getenv("APP_ENV", "development")
    DEBUG = _to_bool(os.getenv("DEBUG"), "false")
    
    # ============================================
    # API CONFIGURATION
    # ============================================
    API_PREFIX = os.getenv("API_PREFIX", "/api/v1")
    PORT = _to_int(os.getenv("PORT"), "8000")
    HOST = os.getenv("HOST", "0.0.0.0")
    
    # ============================================
    # FRONTEND CONFIGURATION (CRITICAL FOR INVITES & CORS)
    # ============================================
    # FRONTEND_URL: Used for generating invite links (ALWAYS HTTPS in production)
    # This should be set to https://web3dkintel.netlify.app in production
    FRONTEND_URL = os.getenv("FRONTEND_URL", "https://web3dkintel.netlify.app")
    
    # Netlify frontend URL (hardcoded for production)
    NETLIFY_URL = "https://web3dkintel.netlify.app"
    
    # FRONTEND_ORIGINS: Used for CORS (can include localhost for development)
    # Format: comma-separated or JSON array
    DEFAULT_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://web3dkintel.netlify.app",
    ]
    
    # Parse FRONTEND_ORIGINS from environment or use defaults
    FRONTEND_ORIGINS = _to_list(
        os.getenv("FRONTEND_ORIGINS"),
        default=",".join(DEFAULT_ORIGINS)
    )
    
    # Ensure Netlify URL is always included for production
    if NETLIFY_URL not in FRONTEND_ORIGINS:
        FRONTEND_ORIGINS.append(NETLIFY_URL)
        logger.info(f"Added {NETLIFY_URL} to CORS origins")
    
    # Ensure FRONTEND_URL is included in FRONTEND_ORIGINS for CORS
    if FRONTEND_URL and FRONTEND_URL not in FRONTEND_ORIGINS:
        FRONTEND_ORIGINS.append(FRONTEND_URL)
    
    # Remove any duplicate origins
    FRONTEND_ORIGINS = list(dict.fromkeys(FRONTEND_ORIGINS))
    
    # Validate HTTPS in production
    if APP_ENV == "production":
        _validate_https_url(FRONTEND_URL, "FRONTEND_URL")
        for origin in FRONTEND_ORIGINS:
            if origin.startswith("http://") and "localhost" not in origin and "127.0.0.1" not in origin:
                logger.warning(f"FRONTEND_ORIGINS contains insecure HTTP origin (non-localhost): {origin}")
    
    # Log CORS configuration on startup
    logger.info(f"CORS configured with {len(FRONTEND_ORIGINS)} origins")
    
    # ============================================
    # WEBSOCKET CONFIGURATION
    # ============================================
    WS_PATH = os.getenv("WS_PATH", "/ws")
    WS_HEARTBEAT_INTERVAL = _to_int(os.getenv("WS_HEARTBEAT_INTERVAL"), "30")
    
    # ============================================
    # AUTHENTICATION & SECURITY
    # ============================================
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = _to_int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"), "1440")  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS = _to_int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"), "7")
    
    # ============================================
    # INVITE CONFIGURATION
    # ============================================
    INVITE_EXPIRY_HOURS = _to_int(os.getenv("INVITE_EXPIRY_HOURS"), "72")
    
    # ============================================
    # API KEYS FOR SCRAPERS
    # ============================================
    # Twitter/X
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
    TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
    TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
    TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET")
    
    # Discord
    DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
    
    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # GitHub
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    
    # CoinGecko
    COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
    
    # ============================================
    # PAYMENT CONFIGURATION
    # ============================================
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
    
    # ============================================
    # SEARCH CONFIGURATION
    # ============================================
    GOOGLE_SEARCH_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")
    GOOGLE_SEARCH_ENGINE_ID = os.getenv("GOOGLE_SEARCH_ENGINE_ID")
    
    # ============================================
    # EMAIL CONFIGURATION (SMTP)
    # ============================================
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = _to_int(os.getenv("SMTP_PORT"), "587")
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
    SMTP_USE_TLS = _to_bool(os.getenv("SMTP_USE_TLS"), "true")
    SMTP_USE_SSL = _to_bool(os.getenv("SMTP_USE_SSL"), "false")
    
    # ============================================
    # DATABASE CONFIGURATION
    # ============================================
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    MONGODB_URL = os.getenv("MONGODB_URL", "")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # ============================================
    # AI & ML CONFIGURATION
    # ============================================
    MODEL_PATH = os.getenv("MODEL_PATH", "models/funding_predictor.pkl")
    FINBERT_MODEL = os.getenv("FINBERT_MODEL", "ProsusAI/finbert")
    ENABLE_AI = _to_bool(os.getenv("ENABLE_AI"), "true")
    
    # ============================================
    # SCRAPER CONFIGURATION
    # ============================================
    ENABLE_SCRAPERS = _to_bool(os.getenv("ENABLE_SCRAPERS"), "true")
    SCRAPER_INTERVAL_MINUTES = _to_int(os.getenv("SCRAPER_INTERVAL_MINUTES"), "60")
    
    # ============================================
    # REDIS & WEBSOCKETS
    # ============================================
    ENABLE_REDIS = _to_bool(os.getenv("ENABLE_REDIS"), "true")
    ENABLE_WEBSOCKETS = _to_bool(os.getenv("ENABLE_WEBSOCKETS"), "true")
    
    # ============================================
    # CELERY CONFIGURATION
    # ============================================
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)
    
    # ============================================
    # RATE LIMITING
    # ============================================
    RATE_LIMIT_ENABLED = _to_bool(os.getenv("RATE_LIMIT_ENABLED"), "true")
    RATE_LIMIT_REQUESTS = _to_int(os.getenv("RATE_LIMIT_REQUESTS"), "100")
    RATE_LIMIT_PERIOD_SECONDS = _to_int(os.getenv("RATE_LIMIT_PERIOD_SECONDS"), "60")
    
    # ============================================
    # LOGGING
    # ============================================
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.getenv("LOG_FORMAT", "json")  # json or text
    
    # ============================================
    # UTILITY METHODS
    # ============================================
    
    @classmethod
    def get_frontend_url(cls) -> str:
        """Get the frontend URL for generating invite links (always HTTPS in production)."""
        url = cls.FRONTEND_URL
        if cls.APP_ENV == "production" and url.startswith("http://"):
            logger.warning(f"FRONTEND_URL uses HTTP in production: {url}")
            # Attempt to convert to HTTPS
            url = url.replace("http://", "https://")
        return url.rstrip('/')
    
    @classmethod
    def get_cors_origins(cls) -> List[str]:
        """Get CORS origins for FastAPI middleware."""
        return cls.FRONTEND_ORIGINS
    
    @classmethod
    def get_netlify_url(cls) -> str:
        """Get the Netlify frontend URL."""
        return cls.NETLIFY_URL
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if running in development mode."""
        return cls.APP_ENV == "development"
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production mode."""
        return cls.APP_ENV == "production"
    
    @classmethod
    def validate_config(cls) -> dict:
        """Validate critical configuration settings."""
        issues = []
        warnings = []
        
        # Check FRONTEND_URL
        if not cls.FRONTEND_URL:
            issues.append("FRONTEND_URL is not set")
        elif cls.is_production() and not cls.FRONTEND_URL.startswith("https://"):
            issues.append(f"FRONTEND_URL must use HTTPS in production: {cls.FRONTEND_URL}")
        
        # Check SECRET_KEY
        if cls.SECRET_KEY == "change-this-in-production" and cls.is_production():
            warnings.append("SECRET_KEY is using default value - change this in production!")
        
        # Check DATABASE_URL
        if not cls.DATABASE_URL and cls.is_production():
            issues.append("DATABASE_URL is not set in production")
        
        # Check email configuration
        if cls.SMTP_HOST and not cls.SMTP_FROM_EMAIL:
            warnings.append("SMTP_HOST is set but SMTP_FROM_EMAIL is missing")
        
        # Check API keys (warnings only, not critical)
        if cls.is_production():
            if not cls.OPENAI_API_KEY:
                warnings.append("OPENAI_API_KEY is not set - AI features will be limited")
            if not cls.TWITTER_BEARER_TOKEN:
                warnings.append("TWITTER_BEARER_TOKEN is not set - Twitter scraping will be limited")
        
        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "environment": cls.APP_ENV,
            "frontend_url": cls.FRONTEND_URL,
            "frontend_origins": cls.FRONTEND_ORIGINS,
            "frontend_origins_count": len(cls.FRONTEND_ORIGINS),
            "netlify_url": cls.NETLIFY_URL,
        }
    
    def as_dict(self) -> dict:
        """Return settings as dictionary for debugging (hides sensitive values)."""
        return {
            # Basic config
            "APP_NAME": self.APP_NAME,
            "APP_ENV": self.APP_ENV,
            "DEBUG": self.DEBUG,
            "API_PREFIX": self.API_PREFIX,
            "PORT": self.PORT,
            "HOST": self.HOST,
            
            # Frontend (critical for invites and CORS)
            "FRONTEND_URL": self.FRONTEND_URL,
            "NETLIFY_URL": self.NETLIFY_URL,
            "FRONTEND_ORIGINS": self.FRONTEND_ORIGINS,
            "INVITE_EXPIRY_HOURS": self.INVITE_EXPIRY_HOURS,
            
            # WebSocket
            "WS_PATH": self.WS_PATH,
            "ENABLE_WEBSOCKETS": self.ENABLE_WEBSOCKETS,
            
            # Database
            "DATABASE_URL_SET": bool(self.DATABASE_URL),
            "MONGODB_URL_SET": bool(self.MONGODB_URL),
            "REDIS_URL_SET": bool(self.REDIS_URL),
            "ENABLE_REDIS": self.ENABLE_REDIS,
            
            # API Keys (only whether they are set, not the actual values)
            "OPENAI_API_KEY_SET": bool(self.OPENAI_API_KEY),
            "GITHUB_TOKEN_SET": bool(self.GITHUB_TOKEN),
            "TWITTER_BEARER_TOKEN_SET": bool(self.TWITTER_BEARER_TOKEN),
            "COINGECKO_API_KEY_SET": bool(self.COINGECKO_API_KEY),
            "DISCORD_BOT_TOKEN_SET": bool(self.DISCORD_BOT_TOKEN),
            
            # Payment
            "STRIPE_SECRET_KEY_SET": bool(self.STRIPE_SECRET_KEY),
            
            # Search
            "GOOGLE_SEARCH_API_KEY_SET": bool(self.GOOGLE_SEARCH_API_KEY),
            
            # Email
            "SMTP_HOST_SET": bool(self.SMTP_HOST),
            "SMTP_FROM_EMAIL": self.SMTP_FROM_EMAIL,
            
            # Features
            "ENABLE_AI": self.ENABLE_AI,
            "ENABLE_SCRAPERS": self.ENABLE_SCRAPERS,
            "RATE_LIMIT_ENABLED": self.RATE_LIMIT_ENABLED,
            
            # Logging
            "LOG_LEVEL": self.LOG_LEVEL,
        }


# Create singleton instance
settings = Settings()

# Log configuration validation on startup
validation = settings.validate_config()
if validation["warnings"]:
    for warning in validation["warnings"]:
        logger.warning(f"Config warning: {warning}")
if not validation["is_valid"]:
    for issue in validation["issues"]:
        logger.error(f"Config error: {issue}")

# Log CORS origins on startup
logger.info(f"CORS origins configured: {settings.get_cors_origins()}")