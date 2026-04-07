from app.database import engine
from sqlalchemy import text

SQL = """
BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    billing_email VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO organizations (id, name, slug, plan, is_active, created_at, updated_at)
VALUES (1, 'Default Organization', 'default-organization', 'starter', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    message TEXT NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_settings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    default_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_report_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    branding_primary_color VARCHAR(50) NOT NULL DEFAULT '#06b6d4',
    custom_domain VARCHAR(255),
    report_logo_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_invites (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    token VARCHAR(255) NOT NULL UNIQUE,
    invited_by_user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(500),
    twitter_handle VARCHAR(255),
    discord_guild_id VARCHAR(255),
    github_repo VARCHAR(255),
    token_symbol VARCHAR(100),
    sector VARCHAR(100),
    stage VARCHAR(100),
    funding_raised DOUBLE PRECISION DEFAULT 0,
    team_size INTEGER DEFAULT 0,
    twitter_followers INTEGER DEFAULT 0,
    twitter_follower_growth_30d DOUBLE PRECISION DEFAULT 0,
    discord_members INTEGER DEFAULT 0,
    discord_growth_30d DOUBLE PRECISION DEFAULT 0,
    github_stars INTEGER DEFAULT 0,
    github_star_growth_30d DOUBLE PRECISION DEFAULT 0,
    market_cap DOUBLE PRECISION DEFAULT 0,
    total_volume DOUBLE PRECISION DEFAULT 0,
    tvl DOUBLE PRECISION DEFAULT 0,
    llm_score DOUBLE PRECISION DEFAULT 0,
    sentiment_score DOUBLE PRECISION DEFAULT 0,
    funding_prediction DOUBLE PRECISION DEFAULT 0,
    momentum_score DOUBLE PRECISION DEFAULT 0,
    overall_score DOUBLE PRECISION DEFAULT 0,
    anomaly_score DOUBLE PRECISION DEFAULT 0,
    last_scraped_at TIMESTAMP NULL,
    last_ai_scored_at TIMESTAMP NULL,
    extra_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS discord_guild_id VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS token_symbol VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS anomaly_score DOUBLE PRECISION DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_ai_scored_at TIMESTAMP NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

UPDATE projects
SET organization_id = 1
WHERE organization_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'projects'
          AND column_name = 'organization_id'
    ) THEN
        BEGIN
            ALTER TABLE projects ALTER COLUMN organization_id SET NOT NULL;
        EXCEPTION
            WHEN others THEN NULL;
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_projects_organization'
          AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects
        ADD CONSTRAINT fk_projects_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id SERIAL PRIMARY KEY,
    watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    note TEXT,
    tag VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_reports (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    type VARCHAR(100) NOT NULL DEFAULT 'Custom',
    audience VARCHAR(100) NOT NULL DEFAULT 'Internal',
    projects_count INTEGER NOT NULL DEFAULT 0,
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS briefings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    points JSONB NOT NULL DEFAULT '[]'::jsonb,
    kind VARCHAR(100) NOT NULL DEFAULT 'Daily',
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
"""

if engine is None:
    raise RuntimeError("Database engine is not available. Check DATABASE_URL in .env")

with engine.begin() as connection:
    connection.execute(text(SQL))

print("Migration completed successfully.")