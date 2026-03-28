from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    website = Column(String)
    twitter_handle = Column(String)
    discord_guild_id = Column(String)
    github_repo = Column(String)
    token_symbol = Column(String)
    sector = Column(String)              # DeFi, GameFi, Infrastructure, etc.
    stage = Column(String)               # pre_seed, seed, series_a, etc.
    funding_raised = Column(Float, default=0.0)  # total USD raised
    team_size = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Scraped metrics
    twitter_followers = Column(Integer, default=0)
    twitter_follower_growth_30d = Column(Float, default=0.0)  # % growth
    discord_members = Column(Integer, default=0)
    discord_growth_30d = Column(Float, default=0.0)
    github_stars = Column(Integer, default=0)
    github_star_growth_30d = Column(Float, default=0.0)
    market_cap = Column(Float, default=0.0)
    total_volume = Column(Float, default=0.0)
    tvl = Column(Float, default=0.0)    # Total Value Locked (DeFi)

    # AI scores
    llm_score = Column(Float, default=0.0)
    sentiment_score = Column(Float, default=0.0)
    funding_prediction = Column(Float, default=0.0)
    momentum_score = Column(Float, default=0.0)   # from growth rates
    overall_score = Column(Float, default=0.0)

    # Raw data cache
    extra_data = Column(JSON, default={})