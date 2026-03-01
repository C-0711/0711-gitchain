-- ===========================================
-- Migration 002: Add missing tables
-- Run after initial schema.sql on existing databases
-- ===========================================

-- Add is_admin to users if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add visibility/description/social columns to containers if missing
ALTER TABLE containers ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE containers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS star_count INTEGER DEFAULT 0;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    website VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_domains JSONB DEFAULT '[]'::jsonb,
    plan VARCHAR(20) DEFAULT 'free',
    billing_email VARCHAR(255),
    sso_provider VARCHAR(50),
    sso_config JSONB DEFAULT '{}'::jsonb,
    require_2fa BOOLEAN DEFAULT FALSE,
    max_members INTEGER,
    max_private_containers INTEGER,
    settings JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE TABLE IF NOT EXISTS organization_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    invited_by UUID REFERENCES users(id),
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Container social tables
CREATE TABLE IF NOT EXISTS container_stars (
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (container_id, user_id)
);

CREATE TABLE IF NOT EXISTS container_watchers (
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    watch_level VARCHAR(20) DEFAULT 'all',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (container_id, user_id)
);

CREATE TABLE IF NOT EXISTS container_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'read',
    invited_by UUID REFERENCES users(id),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(container_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_audit_org ON organization_audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_container_stars_user ON container_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_container_watchers_user ON container_watchers(user_id);
CREATE INDEX IF NOT EXISTS idx_container_collabs_user ON container_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_containers_visibility ON containers(visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_containers_created_by ON containers(created_by) WHERE deleted_at IS NULL;

-- Star count trigger
CREATE OR REPLACE FUNCTION update_container_star_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE containers SET star_count = star_count + 1 WHERE id = NEW.container_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE containers SET star_count = star_count - 1 WHERE id = OLD.container_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stars_count_trigger ON container_stars;
CREATE TRIGGER stars_count_trigger AFTER INSERT OR DELETE ON container_stars
    FOR EACH ROW EXECUTE FUNCTION update_container_star_count();

-- Organization updated_at trigger
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
