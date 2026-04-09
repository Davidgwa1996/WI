from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Optional, List, Dict, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ------------------------------------------------------------
# Shared validators
# ------------------------------------------------------------
def validate_strong_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(value) > 128:
        raise ValueError("Password must not be more than 128 characters long.")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must include at least one uppercase letter.")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must include at least one lowercase letter.")
    if not re.search(r"\d", value):
        raise ValueError("Password must include at least one number.")
    if not re.search(r"[^A-Za-z0-9]", value):
        raise ValueError("Password must include at least one special character.")
    return value


def validate_slug(value: str) -> str:
    """Validate organization slug format."""
    if not re.match(r"^[a-z0-9-]+$", value):
        raise ValueError("Slug must contain only lowercase letters, numbers, and hyphens")
    return value


# ------------------------------------------------------------
# Generic / common
# ------------------------------------------------------------
class ApiMessage(BaseModel):
    message: str
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: float
    app_name: str
    environment: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1440  # minutes


# ------------------------------------------------------------
# Auth
# ------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    organization_name: str
    organization_slug: str
    full_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_strong_password(value)
    
    @field_validator("organization_slug")
    @classmethod
    def slug_valid(cls, value: str) -> str:
        return validate_slug(value)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator("new_password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_strong_password(value)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
    @field_validator("new_password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_strong_password(value)


# Backward compatibility aliases
UserLogin = LoginRequest
UserRegister = RegisterRequest


# ------------------------------------------------------------
# Organizations
# ------------------------------------------------------------
class OrganizationCreate(BaseModel):
    name: str
    slug: str
    billing_email: Optional[EmailStr] = None
    
    @field_validator("slug")
    @classmethod
    def slug_valid(cls, value: str) -> str:
        return validate_slug(value)


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    billing_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    plan: str = "starter"
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    billing_email: Optional[EmailStr] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------
# Users
# ------------------------------------------------------------
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


# ------------------------------------------------------------
# Projects
# ------------------------------------------------------------
class ProjectBase(BaseModel):
    name: str
    sector: Optional[str] = None
    stage: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    twitter_handle: Optional[str] = None
    github_repo: Optional[str] = None
    discord_guild_id: Optional[str] = None
    token_symbol: Optional[str] = None

    team_size: Optional[int] = 0
    funding_raised: Optional[float] = 0.0

    llm_score: Optional[float] = 0.0
    sentiment_score: Optional[float] = 0.0
    momentum_score: Optional[float] = 0.0
    funding_prediction: Optional[float] = 0.0
    overall_score: Optional[float] = 0.0

    twitter_followers: Optional[int] = 0
    twitter_follower_growth_30d: Optional[float] = 0.0

    github_stars: Optional[int] = 0
    github_star_growth_30d: Optional[float] = 0.0

    discord_members: Optional[int] = 0
    discord_growth_30d: Optional[float] = 0.0

    market_cap: Optional[float] = 0.0
    total_volume: Optional[float] = 0.0
    tvl: Optional[float] = 0.0

    anomaly_score: Optional[float] = 0.0
    extra_data: Optional[dict[str, Any]] = None


class ProjectCreate(ProjectBase):
    organization_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    stage: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    twitter_handle: Optional[str] = None
    github_repo: Optional[str] = None
    discord_guild_id: Optional[str] = None
    token_symbol: Optional[str] = None

    team_size: Optional[int] = None
    funding_raised: Optional[float] = None

    llm_score: Optional[float] = None
    sentiment_score: Optional[float] = None
    momentum_score: Optional[float] = None
    funding_prediction: Optional[float] = None
    overall_score: Optional[float] = None

    twitter_followers: Optional[int] = None
    twitter_follower_growth_30d: Optional[float] = None

    github_stars: Optional[int] = None
    github_star_growth_30d: Optional[float] = None

    discord_members: Optional[int] = None
    discord_growth_30d: Optional[float] = None

    market_cap: Optional[float] = None
    total_volume: Optional[float] = None
    tvl: Optional[float] = None

    anomaly_score: Optional[float] = None
    extra_data: Optional[dict[str, Any]] = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    last_scraped_at: Optional[datetime] = None
    last_ai_scored_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ProjectListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sector: Optional[str] = None
    stage: Optional[str] = None
    overall_score: Optional[float] = 0.0
    market_cap: Optional[float] = 0.0
    tvl: Optional[float] = 0.0
    twitter_followers: Optional[int] = 0
    github_stars: Optional[int] = 0
    updated_at: datetime


class ProjectHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    project_id: int
    overall_score: float
    momentum_score: float
    sentiment_score: float
    twitter_followers: int
    github_stars: int
    discord_members: int
    market_cap: float
    recorded_at: datetime


# ------------------------------------------------------------
# API Keys
# ------------------------------------------------------------
class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyCreatedResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    api_key: str
    created_at: datetime


class ApiKeyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# Backward compatibility aliases
APIKeyCreate = ApiKeyCreate
APIKeyCreateResponse = ApiKeyCreatedResponse
APIKeyOut = ApiKeyOut


# ------------------------------------------------------------
# Subscriptions
# ------------------------------------------------------------
class SubscriptionStatusResponse(BaseModel):
    plan: str = "starter"
    is_active: bool = False
    stripe_customer_id: Optional[str] = None
    current_period_end: Optional[datetime] = None


# ------------------------------------------------------------
# Audit logs
# ------------------------------------------------------------
class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    actor_user_id: Optional[int] = None
    actor_user_name: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    message: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata_json: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------
# Invites
# ------------------------------------------------------------
class InviteCreate(BaseModel):
    email: EmailStr
    role: str = "viewer"


class InviteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    email: EmailStr
    role: str
    token: str
    is_accepted: bool
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    invite_link: Optional[str] = None


class InviteAccept(BaseModel):
    token: str
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_strong_password(value)


class InviteResend(BaseModel):
    email: EmailStr


# ------------------------------------------------------------
# Workspace settings
# ------------------------------------------------------------
class WorkspaceSettingUpdate(BaseModel):
    default_alerts_enabled: bool = True
    weekly_report_enabled: bool = False
    branding_primary_color: str = "#06b6d4"
    custom_domain: Optional[str] = None
    report_logo_url: Optional[str] = None


class WorkspaceSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    default_alerts_enabled: bool
    weekly_report_enabled: bool
    branding_primary_color: str
    custom_domain: Optional[str] = None
    report_logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------
# Billing
# ------------------------------------------------------------
class BillingCheckoutRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str


class BillingPortalRequest(BaseModel):
    return_url: str


# ------------------------------------------------------------
# Watchlists (Enhanced with Real-time Features)
# ------------------------------------------------------------
class WatchlistItemCreate(BaseModel):
    project_id: int
    note: Optional[str] = None
    tag: Optional[str] = None


class WatchlistItemUpdate(BaseModel):
    note: Optional[str] = None
    tag: Optional[str] = None


class WatchlistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False
    alert_on_change: bool = True
    alert_threshold: float = 5.0
    notification_channels: List[str] = ["in_app"]


class WatchlistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None


class WatchlistItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    watchlist_id: int
    project_id: int
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    project_stage: Optional[str] = None
    overall_score: Optional[float] = None
    momentum_score: Optional[float] = None
    sentiment_score: Optional[float] = None
    funding_prediction: Optional[float] = None
    twitter_followers: Optional[int] = None
    github_stars: Optional[int] = None
    discord_members: Optional[int] = None
    market_cap: Optional[float] = None
    note: Optional[str] = None
    tag: Optional[str] = None
    added_at: datetime
    added_by: Optional[int] = None
    last_updated: Optional[datetime] = None


class WatchlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    name: str
    description: Optional[str] = None
    is_default: bool
    settings: Optional[Dict[str, Any]] = None
    projects_count: Optional[int] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class WatchlistLiveMetrics(BaseModel):
    project_id: int
    project_name: str
    overall_score: float
    momentum_score: float
    sentiment_score: float
    funding_prediction: float
    twitter_followers: int
    github_stars: int
    discord_members: int
    market_cap: float
    score_change_24h: float
    trend: Literal["up", "down", "stable"]
    last_updated: Optional[str] = None
    note: Optional[str] = None
    tag: Optional[str] = None


class WatchlistChangeDetection(BaseModel):
    project_id: int
    project_name: str
    score_change: float
    twitter_change: int
    github_change: int
    severity: Literal["high", "medium", "low"]
    timestamp: str


class WatchlistAlert(BaseModel):
    project_id: int
    project_name: str
    type: Literal["high_conviction", "low_conviction", "high_momentum", "funding_potential", "anomaly"]
    message: str
    severity: Literal["info", "warning", "success", "critical"]
    timestamp: str


class WatchlistActivity(BaseModel):
    id: int
    watchlist_id: int
    action: Literal["project_added", "project_removed", "project_updated", "alert_triggered"]
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    user_name: Optional[str] = None
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None


class WatchlistSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_default: bool
    projects_count: int
    avg_overall_score: float
    avg_momentum_score: float
    avg_sentiment_score: float
    created_at: Optional[str] = None


# ------------------------------------------------------------
# Reports
# ------------------------------------------------------------
class SavedReportCreate(BaseModel):
    title: str
    summary: Optional[str] = None
    type: str = "Custom"
    audience: str = "Internal"
    project_ids: list[int] = Field(default_factory=list)


class SavedReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    title: str
    summary: Optional[str] = None
    type: str
    audience: str
    projects_count: int
    report_data: dict[str, Any]
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------
# Briefings
# ------------------------------------------------------------
class BriefingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    title: str
    summary: str
    points: list[str]
    kind: str
    is_published: bool
    created_at: datetime
    updated_at: datetime


class BriefingCreate(BaseModel):
    title: str
    summary: str
    points: List[str]
    kind: str = "daily"


# ------------------------------------------------------------
# Search
# ------------------------------------------------------------
class IntelSearchResponse(BaseModel):
    query: str
    results: list[dict[str, Any]]
    total: int
    took_ms: float


class SearchRequest(BaseModel):
    query: str
    limit: int = 20
    offset: int = 0
    filters: Optional[Dict[str, Any]] = None


# ------------------------------------------------------------
# WebSocket Messages
# ------------------------------------------------------------
class WebSocketMessage(BaseModel):
    type: Literal["ping", "pong", "project_update", "watchlist_update", "alert", "anomaly"]
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WatchlistWebSocketMessage(BaseModel):
    type: Literal["project_added", "project_removed", "project_updated", "alert_triggered"]
    watchlist_id: int
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: str


# ------------------------------------------------------------
# Analytics & Metrics
# ------------------------------------------------------------
class ProjectMetrics(BaseModel):
    project_id: int
    project_name: str
    overall_score: float
    momentum_score: float
    sentiment_score: float
    funding_prediction: float
    twitter_growth: float
    github_growth: float
    discord_growth: float
    anomaly_detected: bool
    last_updated: datetime


class DashboardMetrics(BaseModel):
    total_projects: int
    avg_conviction_score: float
    high_conviction_projects: int
    anomalies_detected: int
    active_alerts: int
    last_updated: datetime


# ------------------------------------------------------------
# Exports
# ------------------------------------------------------------
class ExportRequest(BaseModel):
    format: Literal["csv", "json", "pdf"]
    project_ids: Optional[List[int]] = None
    include_metrics: bool = True
    include_history: bool = False
    date_range_days: int = 30


class ExportResponse(BaseModel):
    download_url: str
    expires_at: datetime
    file_size: Optional[int] = None