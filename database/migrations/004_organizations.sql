-- ===========================================
-- GitChain Migration: Organizations
-- Created: 2026-02-24
-- ===========================================

-- ===========================================
-- ORGANIZATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    slug VARCHAR(100) UNIQUE NOT NULL,        -- URL-safe: "bosch", "0711"
    name VARCHAR(255) NOT NULL,               -- Display: "Robert Bosch GmbH"
    description TEXT,
    avatar_url TEXT,
    website VARCHAR(255),
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_domains TEXT[] DEFAULT '{}',     -- ["bosch.com", "bosch.de"]
    
    -- Billing & Plan
    plan VARCHAR(20) DEFAULT 'free',          -- free, pro, enterprise
    billing_email VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    
    -- Enterprise Features
    sso_provider VARCHAR(50),                 -- saml, oidc, azure-ad, okta
    sso_config JSONB DEFAULT '{}'::jsonb,
    allowed_ip_ranges INET[],
    require_2fa BOOLEAN DEFAULT FALSE,
    
    -- Limits (null = unlimited)
    max_members INTEGER,
    max_private_containers INTEGER,
    max_storage_gb INTEGER,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orgs_plan ON organizations(plan) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orgs_verified ON organizations(verified) WHERE deleted_at IS NULL;

-- ===========================================
-- ORGANIZATION MEMBERS
-- ===========================================

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role hierarchy: owner > admin > maintainer > member > viewer
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    
    -- Invite tracking
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',     -- pending, active, suspended
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- ===========================================
-- ORGANIZATION TEAMS (optional grouping)
-- ===========================================

CREATE TABLE IF NOT EXISTS organization_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Team permissions
    default_container_role VARCHAR(20) DEFAULT 'read',  -- For new containers
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, slug)
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id UUID NOT NULL REFERENCES organization_teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',        -- maintainer, member
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- ===========================================
-- UPDATE CONTAINERS FOR ORG OWNERSHIP
-- ===========================================

-- Container can belong to user OR organization
ALTER TABLE containers 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Index for org containers
CREATE INDEX IF NOT EXISTS idx_containers_org 
ON containers(org_id) WHERE deleted_at IS NULL;

-- ===========================================
-- ORGANIZATION INVITES
-- ===========================================

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

CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);

-- ===========================================
-- AUDIT LOG FOR ORGANIZATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS organization_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,             -- member.added, settings.changed, etc.
    target_type VARCHAR(50),                  -- user, container, settings
    target_id UUID,
    
    old_value JSONB,
    new_value JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_audit_org ON organization_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_org_audit_time ON organization_audit_log(created_at DESC);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS org_members_updated_at ON organization_members;
CREATE TRIGGER org_members_updated_at BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Check if user is org member with minimum role
CREATE OR REPLACE FUNCTION user_has_org_role(
    p_user_id UUID,
    p_org_id UUID,
    p_min_role VARCHAR DEFAULT 'member'
) RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
    v_role_level INTEGER;
    v_min_level INTEGER;
BEGIN
    -- Role hierarchy
    SELECT CASE role
        WHEN 'owner' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'maintainer' THEN 3
        WHEN 'member' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END INTO v_role_level
    FROM organization_members
    WHERE org_id = p_org_id AND user_id = p_user_id AND status = 'active';
    
    IF v_role_level IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT CASE p_min_role
        WHEN 'owner' THEN 5
        WHEN 'admin' THEN 4
        WHEN 'maintainer' THEN 3
        WHEN 'member' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END INTO v_min_level;
    
    RETURN v_role_level >= v_min_level;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- DONE
-- ===========================================
