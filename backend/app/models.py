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
    Index,
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

    # Relationships
    users = relationship(
        "User",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    api_keys = relationship(
        "APIKey",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    projects = relationship(
        "Project",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    watchlists = relationship(
        "Watchlist",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    invites = relationship(
        "TeamInvite",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    briefings = relationship(
        "Briefing",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    saved_reports = relationship(
        "SavedReport",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    workspace_settings = relationship(
        "WorkspaceSetting",
        back_populates="organization",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}', slug='{self.slug}')>"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)

    role = Column(String(50), default="viewer", nullable=False)  # owner, admin, analyst, member, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")

    audit_logs = relationship(
        "AuditLog",
        back_populates="actor",
        foreign_keys="AuditLog.actor_user_id",
        passive_deletes=True,
    )
    sent_invites = relationship(
        "TeamInvite",
        foreign_keys="TeamInvite.invited_by_user_id",
        back_populates="invited_by",
        passive_deletes=True,
    )
    created_watchlists = relationship(
        "Watchlist",
        foreign_keys="Watchlist.created_by",
        back_populates="creator",
        passive_deletes=True,
    )
    watchlist_items_added = relationship(
        "WatchlistItem",
        foreign_keys="WatchlistItem.added_by",
        back_populates="adder",
        passive_deletes=True,
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


class APIKey(Base, TimestampMixin):
    __tablename__ = "api_keys"
    __table_args__ = (
        UniqueConstraint("key_prefix", name="uq_api_keys_key_prefix"),
    )

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(255), nullable=False)
    key_prefix = Column(String(20), nullable=False, index=True)
    key_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="api_keys")

    @staticmethod
    def generate_plaintext_key() -> str:
        return f"w3i_{secrets.token_urlsafe(32)}"

    def __repr__(self):
        return f"<APIKey(id={self.id}, name='{self.name}', key_prefix='{self.key_prefix}')>"


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=True)
    message = Column(Text, nullable=False)

    ip_address = Column(String(100), nullable=True)
    user_agent = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)

    organization = relationship("Organization", back_populates="audit_logs")
    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_user_id])

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', organization_id={self.organization_id})>"


class WorkspaceSetting(Base, TimestampMixin):
    __tablename__ = "workspace_settings"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    default_alerts_enabled = Column(Boolean, default=True, nullable=False)
    weekly_report_enabled = Column(Boolean, default=False, nullable=False)
    branding_primary_color = Column(String(50), default="#06b6d4", nullable=False)
    custom_domain = Column(String(255), nullable=True)
    report_logo_url = Column(String(500), nullable=True)

    organization = relationship("Organization", back_populates="workspace_settings")

    def __repr__(self):
        return f"<WorkspaceSetting(organization_id={self.organization_id})>"


class TeamInvite(Base, TimestampMixin):
    __tablename__ = "team_invites"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), default="viewer", nullable=False)  # owner, admin, analyst, member, viewer
    token = Column(String(255), nullable=False, unique=True, index=True)
    invited_by_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_accepted = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="invites")
    invited_by = relationship("User", foreign_keys=[invited_by_user_id], back_populates="sent_invites")

    def __repr__(self):
        return f"<TeamInvite(id={self.id}, email='{self.email}', role='{self.role}', is_accepted={self.is_accepted})>"


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

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

    llm_score = Column(Float, default=50.0)
    sentiment_score = Column(Float, default=50.0)
    funding_prediction = Column(Float, default=50.0)
    momentum_score = Column(Float, default=50.0)
    overall_score = Column(Float, default=50.0)
    anomaly_score = Column(Float, default=0.0)

    last_scraped_at = Column(DateTime, nullable=True)
    last_ai_scored_at = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)

    extra_data = Column(JSON, default=dict)

    organization = relationship("Organization", back_populates="projects")
    history = relationship("ProjectHistory", back_populates="project", cascade="all, delete-orphan", passive_deletes=True)
    watchlist_items = relationship("WatchlistItem", back_populates="project", cascade="all, delete-orphan", passive_deletes=True)

    __table_args__ = (
        Index("idx_project_sector_stage", "sector", "stage"),
        Index("idx_project_overall_score", "overall_score"),
        Index("idx_project_created_at", "created_at"),
        Index("idx_project_organization", "organization_id"),
        Index("idx_project_updated_at", "updated_at"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "website": self.website,
            "twitter_handle": self.twitter_handle,
            "discord_guild_id": self.discord_guild_id,
            "github_repo": self.github_repo,
            "token_symbol": self.token_symbol,
            "sector": self.sector,
            "stage": self.stage,
            "funding_raised": self.funding_raised,
            "team_size": self.team_size,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "twitter_followers": self.twitter_followers,
            "twitter_follower_growth_30d": self.twitter_follower_growth_30d,
            "discord_members": self.discord_members,
            "discord_growth_30d": self.discord_growth_30d,
            "github_stars": self.github_stars,
            "github_star_growth_30d": self.github_star_growth_30d,
            "market_cap": self.market_cap,
            "total_volume": self.total_volume,
            "tvl": self.tvl,
            "llm_score": self.llm_score,
            "sentiment_score": self.sentiment_score,
            "funding_prediction": self.funding_prediction,
            "momentum_score": self.momentum_score,
            "overall_score": self.overall_score,
            "anomaly_score": self.anomaly_score,
            "is_active": self.is_active,
            "is_featured": self.is_featured,
            "extra_data": self.extra_data or {},
        }

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', stage='{self.stage}', overall_score={self.overall_score})>"


class ProjectHistory(Base, TimestampMixin):
    __tablename__ = "project_history"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    overall_score = Column(Float, default=0.0)
    momentum_score = Column(Float, default=0.0)
    sentiment_score = Column(Float, default=0.0)
    funding_prediction = Column(Float, default=0.0)

    twitter_followers = Column(Integer, default=0)
    github_stars = Column(Integer, default=0)
    discord_members = Column(Integer, default=0)
    market_cap = Column(Float, default=0.0)
    tvl = Column(Float, default=0.0)

    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    trigger_source = Column(String(50), default="scraper")

    project = relationship("Project", back_populates="history")

    __table_args__ = (
        Index("idx_project_history_project", "project_id"),
        Index("idx_project_history_recorded", "recorded_at"),
        Index("idx_project_history_project_recorded", "project_id", "recorded_at"),
    )

    def __repr__(self):
        return f"<ProjectHistory(project_id={self.project_id}, overall_score={self.overall_score}, recorded_at={self.recorded_at})>"


class Watchlist(Base, TimestampMixin):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)

    settings = Column(
        JSON,
        default={
            "alert_on_change": True,
            "alert_threshold": 5.0,
            "notification_channels": ["in_app"],
        },
    )

    organization = relationship("Organization", back_populates="watchlists")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan", passive_deletes=True)

    def __repr__(self):
        return f"<Watchlist(id={self.id}, name='{self.name}', organization_id={self.organization_id})>"


class WatchlistItem(Base, TimestampMixin):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(
        Integer,
        ForeignKey("watchlists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    note = Column(Text, nullable=True)
    tag = Column(String(100), nullable=True)
    added_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    watchlist = relationship("Watchlist", back_populates="items")
    project = relationship("Project", back_populates="watchlist_items")
    adder = relationship("User", foreign_keys=[added_by], back_populates="watchlist_items_added")

    __table_args__ = (
        UniqueConstraint("watchlist_id", "project_id", name="uq_watchlist_item"),
        Index("idx_watchlist_item_watchlist", "watchlist_id"),
        Index("idx_watchlist_item_project", "project_id"),
    )

    def __repr__(self):
        return f"<WatchlistItem(id={self.id}, watchlist_id={self.watchlist_id}, project_id={self.project_id})>"


class SavedReport(Base, TimestampMixin):
    __tablename__ = "saved_reports"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    type = Column(String(100), default="Custom", nullable=False)
    audience = Column(String(100), default="Internal", nullable=False)
    projects_count = Column(Integer, default=0, nullable=False)
    report_data = Column(JSON, default=dict)

    organization = relationship("Organization", back_populates="saved_reports")

    def __repr__(self):
        return f"<SavedReport(id={self.id}, title='{self.title}', type='{self.type}')>"


class Briefing(Base, TimestampMixin):
    __tablename__ = "briefings"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    points = Column(JSON, default=list)
    kind = Column(String(100), default="Daily", nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="briefings")

    def __repr__(self):
        return f"<Briefing(id={self.id}, title='{self.title}', kind='{self.kind}')>"


def create_tables(engine):
    Base.metadata.create_all(bind=engine)


def drop_tables(engine):
    Base.metadata.drop_all(bind=engine)