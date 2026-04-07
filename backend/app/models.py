from __future__ import annotations

import secrets
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    plan = Column(String(50), default="starter", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    billing_email = Column(String(255), nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)

    role = Column(String(50), default="viewer", nullable=False)  # owner, admin, analyst, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="actor", foreign_keys="AuditLog.actor_user_id")


class APIKey(Base, TimestampMixin):
    __tablename__ = "api_keys"
    __table_args__ = (
        UniqueConstraint("key_prefix", name="uq_api_keys_key_prefix"),
    )

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    key_prefix = Column(String(20), nullable=False, index=True)
    key_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="api_keys")

    @staticmethod
    def generate_plaintext_key() -> str:
        return f"w3i_{secrets.token_urlsafe(32)}"


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=True)
    message = Column(Text, nullable=False)

    ip_address = Column(String(100), nullable=True)
    user_agent = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)

    organization = relationship("Organization", back_populates="audit_logs")
    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_user_id])


class WorkspaceSetting(Base, TimestampMixin):
    __tablename__ = "workspace_settings"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, unique=True, index=True)

    default_alerts_enabled = Column(Boolean, default=True, nullable=False)
    weekly_report_enabled = Column(Boolean, default=False, nullable=False)
    branding_primary_color = Column(String(50), default="#06b6d4", nullable=False)
    custom_domain = Column(String(255), nullable=True)
    report_logo_url = Column(String(500), nullable=True)


class TeamInvite(Base, TimestampMixin):
    __tablename__ = "team_invites"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), default="viewer", nullable=False)
    token = Column(String(255), nullable=False, unique=True, index=True)
    invited_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_accepted = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    organization = relationship("Organization")
    invited_by = relationship("User", foreign_keys=[invited_by_user_id])


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)
    twitter_handle = Column(String(255), nullable=True)
    discord_guild_id = Column(String(255), nullable=True)
    github_repo = Column(String(255), nullable=True)
    token_symbol = Column(String(100), nullable=True)
    sector = Column(String(100), nullable=True)
    stage = Column(String(100), nullable=True)
    funding_raised = Column(Float, default=0.0)
    team_size = Column(Integer, default=0)

    twitter_followers = Column(Integer, default=0)
    twitter_follower_growth_30d = Column(Float, default=0.0)
    discord_members = Column(Integer, default=0)
    discord_growth_30d = Column(Float, default=0.0)
    github_stars = Column(Integer, default=0)
    github_star_growth_30d = Column(Float, default=0.0)
    market_cap = Column(Float, default=0.0)
    total_volume = Column(Float, default=0.0)
    tvl = Column(Float, default=0.0)

    llm_score = Column(Float, default=0.0)
    sentiment_score = Column(Float, default=0.0)
    funding_prediction = Column(Float, default=0.0)
    momentum_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)

    last_scraped_at = Column(DateTime, nullable=True)
    last_ai_scored_at = Column(DateTime, nullable=True)

    extra_data = Column(JSON, default=dict)

    organization = relationship("Organization", back_populates="projects")


class Watchlist(Base, TimestampMixin):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)

    organization = relationship("Organization")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")


class WatchlistItem(Base, TimestampMixin):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    note = Column(Text, nullable=True)
    tag = Column(String(100), nullable=True)

    watchlist = relationship("Watchlist", back_populates="items")
    project = relationship("Project")


class SavedReport(Base, TimestampMixin):
    __tablename__ = "saved_reports"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    type = Column(String(100), default="Custom", nullable=False)
    audience = Column(String(100), default="Internal", nullable=False)
    projects_count = Column(Integer, default=0, nullable=False)
    report_data = Column(JSON, default=dict)

    organization = relationship("Organization")


class Briefing(Base, TimestampMixin):
    __tablename__ = "briefings"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    points = Column(JSON, default=list)
    kind = Column(String(100), default="Daily", nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)

    organization = relationship("Organization")