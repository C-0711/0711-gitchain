-- ===========================================
-- GitChain Production Schema
-- Created: 2026-02-23
-- ===========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- USERS & AUTH
-- ===========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    username VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    company VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    scopes JSONB DEFAULT '["read", "write"]'::jsonb,
    last_used_at TIMESTAMPTZ,
    last_used_ip INET,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

-- ===========================================
-- NAMESPACES
-- ===========================================

CREATE TABLE IF NOT EXISTS namespaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    owner_id UUID REFERENCES users(id),
    visibility VARCHAR(20) DEFAULT 'public',
    settings JSONB DEFAULT '{}'::jsonb,
    container_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS namespace_members (
    namespace_id UUID NOT NULL REFERENCES namespaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (namespace_id, user_id)
);

-- ===========================================
-- ORGANIZATIONS
-- ===========================================

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

-- ===========================================
-- CONTAINERS
-- ===========================================

CREATE TABLE IF NOT EXISTS containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id TEXT UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    namespace_id UUID REFERENCES namespaces(id),
    namespace VARCHAR(100) NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    
    -- Content
    data JSONB NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    
    -- Verification
    content_hash VARCHAR(64),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    -- Visibility & Description
    visibility VARCHAR(20) DEFAULT 'public',
    description TEXT,
    star_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    org_id UUID REFERENCES organizations(id),

    -- Ownership
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    UNIQUE(namespace, identifier, version)
);

-- ===========================================
-- CONTAINER SOCIAL (STARS, WATCHERS, COLLABORATORS)
-- ===========================================

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

-- ===========================================
-- CONTAINER FILES
-- ===========================================

CREATE TABLE IF NOT EXISTS container_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size BIGINT,
    checksum VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- VERSION HISTORY (COMMITS)
-- ===========================================

CREATE TABLE IF NOT EXISTS container_commits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    meta JSONB,
    message TEXT,
    author_id UUID REFERENCES users(id),
    commit_hash VARCHAR(64) NOT NULL,
    parent_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(container_id, version)
);

-- ===========================================
-- BLOCKCHAIN
-- ===========================================

CREATE TABLE IF NOT EXISTS blockchain_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id INTEGER,
    merkle_root VARCHAR(66) NOT NULL,
    metadata_uri TEXT,
    tx_hash VARCHAR(66),
    block_number BIGINT,
    network VARCHAR(50) DEFAULT 'base-mainnet',
    container_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    anchored_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS container_anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES blockchain_batches(id) ON DELETE CASCADE,
    content_hash VARCHAR(64) NOT NULL,
    merkle_proof JSONB,
    proof_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(container_id, batch_id)
);

-- ===========================================
-- SEARCH & ANALYTICS
-- ===========================================

CREATE TABLE IF NOT EXISTS container_stats (
    container_id UUID PRIMARY KEY REFERENCES containers(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    inject_count INTEGER DEFAULT 0,
    verify_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    api_key_id UUID REFERENCES api_keys(id),
    container_id UUID REFERENCES containers(id),
    action VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    response_status INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE deleted_at IS NULL;

-- API Keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash) WHERE revoked_at IS NULL;

-- Namespaces
CREATE INDEX IF NOT EXISTS idx_namespaces_name ON namespaces(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_namespaces_owner ON namespaces(owner_id) WHERE deleted_at IS NULL;

-- Containers
CREATE INDEX IF NOT EXISTS idx_containers_type ON containers(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_containers_namespace ON containers(namespace) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_containers_identifier ON containers(identifier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_containers_created ON containers(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_containers_container_id ON containers(container_id) WHERE deleted_at IS NULL;

-- Full-text search on container data
CREATE INDEX IF NOT EXISTS idx_containers_data_gin ON containers USING GIN(data jsonb_path_ops);

-- Container files
CREATE INDEX IF NOT EXISTS idx_container_files_container ON container_files(container_id);

-- Commits
CREATE INDEX IF NOT EXISTS idx_commits_container ON container_commits(container_id);
CREATE INDEX IF NOT EXISTS idx_commits_hash ON container_commits(commit_hash);

-- Blockchain
CREATE INDEX IF NOT EXISTS idx_batches_status ON blockchain_batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_tx ON blockchain_batches(tx_hash);
CREATE INDEX IF NOT EXISTS idx_anchors_container ON container_anchors(container_id);
CREATE INDEX IF NOT EXISTS idx_anchors_hash ON container_anchors(content_hash);

-- Access log
CREATE INDEX IF NOT EXISTS idx_access_log_time ON access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_user ON access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_container ON access_log(container_id);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_audit_org ON organization_audit_log(org_id, created_at DESC);

-- Container social
CREATE INDEX IF NOT EXISTS idx_container_stars_user ON container_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_container_watchers_user ON container_watchers(user_id);
CREATE INDEX IF NOT EXISTS idx_container_collabs_user ON container_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_containers_visibility ON containers(visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_containers_created_by ON containers(created_by) WHERE deleted_at IS NULL;

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS namespaces_updated_at ON namespaces;
CREATE TRIGGER namespaces_updated_at BEFORE UPDATE ON namespaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS containers_updated_at ON containers;
CREATE TRIGGER containers_updated_at BEFORE UPDATE ON containers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update namespace container count
CREATE OR REPLACE FUNCTION update_namespace_container_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE namespaces SET container_count = container_count + 1 WHERE id = NEW.namespace_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE namespaces SET container_count = container_count - 1 WHERE id = OLD.namespace_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS containers_count_trigger ON containers;
CREATE TRIGGER containers_count_trigger AFTER INSERT OR DELETE ON containers
    FOR EACH ROW EXECUTE FUNCTION update_namespace_container_count();

-- Auto-update star_count on containers
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

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- System user for automated operations
INSERT INTO users (id, email, name, username, email_verified, is_admin)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@gitchain.0711.io',
    'GitChain System',
    'system',
    TRUE,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Default namespace for Bosch
INSERT INTO namespaces (name, display_name, description, visibility)
VALUES (
    'bosch',
    'Bosch Thermotechnik',
    'Bosch heat pump products and documentation',
    'public'
) ON CONFLICT (name) DO NOTHING;

-- Demo namespace
INSERT INTO namespaces (name, display_name, description, visibility)
VALUES (
    'demo',
    'Demo',
    'Demo containers for testing',
    'public'
) ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- DONE
-- ===========================================
