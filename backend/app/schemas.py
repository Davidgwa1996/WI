from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


# ------------------------------------------------------------
# Base Project Schema
# ------------------------------------------------------------
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    website: Optional[str] = None
    twitter_handle: Optional[str] = None
    discord_guild_id: Optional[str] = None
    github_repo: Optional[str] = None
    token_symbol: Optional[str] = None
    sector: Optional[str] = None
    stage: Optional[str] = None
    funding_raised: float = 0.0
    team_size: int = 0


# ------------------------------------------------------------
# Create / Update Schemas
# ------------------------------------------------------------
class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    website: Optional[str] = None
    twitter_handle: Optional[str] = None
    discord_guild_id: Optional[str] = None
    github_repo: Optional[str] = None
    token_symbol: Optional[str] = None
    sector: Optional[str] = None
    stage: Optional[str] = None
    funding_raised: Optional[float] = None
    team_size: Optional[int] = None

    twitter_followers: Optional[int] = None
    twitter_follower_growth_30d: Optional[float] = None
    discord_members: Optional[int] = None
    discord_growth_30d: Optional[float] = None
    github_stars: Optional[int] = None
    github_star_growth_30d: Optional[float] = None
    market_cap: Optional[float] = None
    total_volume: Optional[float] = None
    tvl: Optional[float] = None

    llm_score: Optional[float] = None
    sentiment_score: Optional[float] = None
    funding_prediction: Optional[float] = None
    momentum_score: Optional[float] = None
    overall_score: Optional[float] = None


# ------------------------------------------------------------
# Metrics / AI Scores
# ------------------------------------------------------------
class ProjectMetrics(BaseModel):
    twitter_followers: int = 0
    twitter_follower_growth_30d: float = 0.0
    discord_members: int = 0
    discord_growth_30d: float = 0.0
    github_stars: int = 0
    github_star_growth_30d: float = 0.0
    market_cap: float = 0.0
    total_volume: float = 0.0
    tvl: float = 0.0


class ProjectScores(BaseModel):
    llm_score: float = 0.0
    sentiment_score: float = 0.0
    funding_prediction: float = 0.0
    momentum_score: float = 0.0
    overall_score: float = 0.0


# ------------------------------------------------------------
# Full Output Schema
# ------------------------------------------------------------
class ProjectOut(ProjectBase):
    id: int

    twitter_followers: int = 0
    twitter_follower_growth_30d: float = 0.0
    discord_members: int = 0
    discord_growth_30d: float = 0.0
    github_stars: int = 0
    github_star_growth_30d: float = 0.0
    market_cap: float = 0.0
    total_volume: float = 0.0
    tvl: float = 0.0

    llm_score: float = 0.0
    sentiment_score: float = 0.0
    funding_prediction: float = 0.0
    momentum_score: float = 0.0
    overall_score: float = 0.0

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ------------------------------------------------------------
# Lightweight List Item Schema
# Useful for dashboard cards / summaries
# ------------------------------------------------------------
class ProjectListItem(BaseModel):
    id: int
    name: str
    sector: Optional[str] = None
    stage: Optional[str] = None
    token_symbol: Optional[str] = None
    overall_score: float = 0.0
    sentiment_score: float = 0.0
    momentum_score: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# ------------------------------------------------------------
# API Response Wrappers
# ------------------------------------------------------------
class ProjectListResponse(BaseModel):
    total: int
    items: List[ProjectOut]


class HealthResponse(BaseModel):
    status: str
    timestamp: float
    app_name: Optional[str] = None


class ApiMessage(BaseModel):
    message: str


# ------------------------------------------------------------
# WebSocket Event Schema
# For real-time streaming updates
# ------------------------------------------------------------
class WebSocketEvent(BaseModel):
    type: str
    message: Optional[str] = None
    data: Optional[dict] = None