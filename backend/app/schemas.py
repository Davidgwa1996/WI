from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProjectBase(BaseModel):
    name: str
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

class ProjectOut(ProjectBase):
    id: int
    twitter_followers: int
    twitter_follower_growth_30d: float
    discord_members: int
    discord_growth_30d: float
    github_stars: int
    github_star_growth_30d: float
    market_cap: float
    total_volume: float
    tvl: float
    llm_score: float
    sentiment_score: float
    funding_prediction: float
    momentum_score: float
    overall_score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
