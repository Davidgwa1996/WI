from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    JSON,
    Boolean,
    Text,
)
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class Project(Base):
    __tablename__ = "projects"

    # ------------------------------------------------------------
    # Core identity
    # ------------------------------------------------------------
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # ------------------------------------------------------------
    # Public links / social handles
    # ------------------------------------------------------------
    website = Column(String(500), nullable=True)
    twitter_handle = Column(String(255), nullable=True, index=True)
    discord_guild_id = Column(String(255), nullable=True, index=True)
    github_repo = Column(String(255), nullable=True, index=True)
    token_symbol = Column(String(50), nullable=True, index=True)

    # ------------------------------------------------------------
    # Business / project classification
    # ------------------------------------------------------------
    sector = Column(String(100), nullable=True, index=True)   # DeFi, AI, Infra, GameFi...
    stage = Column(String(100), nullable=True, index=True)    # pre_seed, seed, series_a...
    funding_raised = Column(Float, default=0.0, nullable=False)
    team_size = Column(Integer, default=0, nullable=False)

    # ------------------------------------------------------------
    # Status / ingestion controls
    # ------------------------------------------------------------
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    source = Column(String(100), nullable=True)               # manual, twitter, github, api
    ingestion_status = Column(String(50), default="pending", nullable=False)
    last_scraped_at = Column(DateTime, nullable=True)
    last_ai_scored_at = Column(DateTime, nullable=True)

    # ------------------------------------------------------------
    # Scraped social / market metrics
    # ------------------------------------------------------------
    twitter_followers = Column(Integer, default=0, nullable=False)
    twitter_follower_growth_30d = Column(Float, default=0.0, nullable=False)

    discord_members = Column(Integer, default=0, nullable=False)
    discord_growth_30d = Column(Float, default=0.0, nullable=False)

    github_stars = Column(Integer, default=0, nullable=False)
    github_star_growth_30d = Column(Float, default=0.0, nullable=False)

    market_cap = Column(Float, default=0.0, nullable=False)
    total_volume = Column(Float, default=0.0, nullable=False)
    tvl = Column(Float, default=0.0, nullable=False)  # Total Value Locked

    # ------------------------------------------------------------
    # AI / scoring outputs
    # ------------------------------------------------------------
    llm_score = Column(Float, default=0.0, nullable=False)
    sentiment_score = Column(Float, default=0.0, nullable=False)
    funding_prediction = Column(Float, default=0.0, nullable=False)
    momentum_score = Column(Float, default=0.0, nullable=False)
    overall_score = Column(Float, default=0.0, nullable=False)

    # ------------------------------------------------------------
    # Optional richer analytics
    # ------------------------------------------------------------
    anomaly_score = Column(Float, default=0.0, nullable=False)
    recommendation_label = Column(String(100), nullable=True)   # buy/watch/hold/high-risk
    risk_level = Column(String(50), nullable=True)              # low/medium/high
    trend_direction = Column(String(50), nullable=True)         # bullish/bearish/neutral

    # ------------------------------------------------------------
    # Flexible raw / cached data
    # ------------------------------------------------------------
    extra_data = Column(JSON, default=dict, nullable=False)
    raw_social_data = Column(JSON, default=dict, nullable=False)
    raw_market_data = Column(JSON, default=dict, nullable=False)
    raw_ai_output = Column(JSON, default=dict, nullable=False)

    # ------------------------------------------------------------
    # Audit timestamps
    # ------------------------------------------------------------
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return (
            f"<Project(id={self.id}, name='{self.name}', "
            f"sector='{self.sector}', stage='{self.stage}', "
            f"overall_score={self.overall_score})>"
        )