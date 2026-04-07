-- ============================================================
-- Web3 Intel Platform - Final PostgreSQL Migration
-- File: backend/sql/final_postgresql_migration.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. organizations
-- ------------------------------------------------------------
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

-- Ensure default organization exists for legacy project rows
INSERT INTO organizations (id, name, slug, plan, is_active, created_at, updated_at)
VALUES (1, 'Default Organization', 'default-organization', 'starter', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- keep sequence aligned
SELECT setval(
    pg_get_serial_sequence('organizations', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM organizations), 1),
    true
);

-- ------------------------------------------------------------
-- 2. users
-- ------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS ix_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- ------------------------------------------------------------
-- 3. api_keys
-- ------------------------------------------------------------
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS ix_api_keys_organization_id ON api_keys(organization_id);

-- ------------------------------------------------------------
-- 4. audit_logs
-- ------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS ix_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs(action);

-- ------------------------------------------------------------
-- 5. workspace_settings
-- ------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS ix_workspace_settings_organization_id ON workspace_settings(organization_id);

-- ------------------------------------------------------------
-- 6. team_invites
-- ------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS ix_team_invites_organization_id ON team_invites(organization_id);
CREATE INDEX IF NOT EXISTS ix_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS ix_team_invites_token ON team_invites(token);

-- ------------------------------------------------------------
-- 7. projects - patch existing table
-- ------------------------------------------------------------
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS organization_id INTEGER,
    ADD COLUMN IF NOT EXISTS discord_guild_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS token_symbol VARCHAR(100),
    ADD COLUMN IF NOT EXISTS anomaly_score DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS last_ai_scored_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Backfill legacy rows to default org
UPDATE projects
SET organization_id = 1
WHERE organization_id IS NULL;

-- Make organization_id required
ALTER TABLE projects
    ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key only if missing
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

CREATE INDEX IF NOT EXISTS ix_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS ix_projects_name ON projects(name);

-- ------------------------------------------------------------
-- 8. watchlists
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_watchlists_organization_id ON watchlists(organization_id);

-- ------------------------------------------------------------
-- 9. watchlist_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlist_items (
    id SERIAL PRIMARY KEY,
    watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    note TEXT,
    tag VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);
CREATE INDEX IF NOT EXISTS ix_watchlist_items_project_id ON watchlist_items(project_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_watchlist_project'
    ) THEN
        ALTER TABLE watchlist_items
        ADD CONSTRAINT uq_watchlist_project UNIQUE (watchlist_id, project_id);
    END IF;
END $$;

-- ------------------------------------------------------------
-- 10. saved_reports
-- ------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS ix_saved_reports_organization_id ON saved_reports(organization_id);

-- ------------------------------------------------------------
-- 11. briefings
-- ------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS ix_briefings_organization_id ON briefings(organization_id);

-- ------------------------------------------------------------
-- 12. optional helper function for updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 13. attach updated_at trigger to all tables
-- ------------------------------------------------------------
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'organizations',
        'users',
        'api_keys',
        'audit_logs',
        'workspace_settings',
        'team_invites',
        'projects',
        'watchlists',
        'watchlist_items',
        'saved_reports',
        'briefings'
    ]
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'trg_' || tbl || '_updated_at'
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER trg_%I_updated_at
                 BEFORE UPDATE ON %I
                 FOR EACH ROW
                 EXECUTE FUNCTION set_updated_at();',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;

COMMIT;