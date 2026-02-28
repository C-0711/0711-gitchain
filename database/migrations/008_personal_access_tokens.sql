-- GitChain Migration 008: Personal Access Tokens (Fine-Grained)
-- GitHub-style token system with granular permissions

-- =============================================================================
-- PERSONAL ACCESS TOKENS
-- =============================================================================
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,

    -- Token storage (only store hash, prefix for identification)
    token_prefix VARCHAR(12) NOT NULL,  -- gc_pat_xxxx (first 12 chars)
    token_hash VARCHAR(64) NOT NULL,     -- SHA-256 hash of full token

    -- Permissions (fine-grained scopes)
    scopes JSONB NOT NULL DEFAULT '[]',

    -- Resource targeting
    -- null = all accessible resources, array = specific container IDs
    container_ids UUID[] DEFAULT NULL,
    -- null = all orgs, array = specific org IDs
    org_ids UUID[] DEFAULT NULL,

    -- Lifecycle
    expires_at TIMESTAMPTZ,              -- null = never expires
    last_used_at TIMESTAMPTZ,
    last_used_ip INET,

    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    UNIQUE(token_hash)
);

-- Indexes
CREATE INDEX idx_pat_user ON personal_access_tokens(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_pat_prefix ON personal_access_tokens(token_prefix) WHERE revoked_at IS NULL;
CREATE INDEX idx_pat_hash ON personal_access_tokens(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_pat_expiry ON personal_access_tokens(expires_at) WHERE expires_at IS NOT NULL AND revoked_at IS NULL;

-- =============================================================================
-- AVAILABLE SCOPES
-- =============================================================================
COMMENT ON COLUMN personal_access_tokens.scopes IS 'Array of scope strings:
  - containers:read    - Read container metadata, atoms
  - containers:write   - Create/update containers
  - containers:delete  - Delete containers
  - atoms:read         - Read atom content
  - atoms:write        - Create/update atoms
  - chain:read         - Read certification status
  - chain:certify      - Certify content, submit batches
  - orgs:read          - Read org membership
  - orgs:admin         - Manage org members, settings
  - user:read          - Read own profile
  - user:write         - Update own profile
  - notifications:read - Read notifications
  - webhooks:read      - Read webhooks
  - webhooks:write     - Create/manage webhooks
';

-- =============================================================================
-- GITCHAIN APPS (OAuth Applications)
-- =============================================================================
CREATE TABLE IF NOT EXISTS gitchain_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Owner (user or org)
    owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    owner_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- OAuth credentials
    client_id VARCHAR(40) NOT NULL UNIQUE,
    client_secret_hash VARCHAR(64) NOT NULL,
    redirect_uris TEXT[] NOT NULL DEFAULT '{}',

    -- Permissions requested
    permissions JSONB NOT NULL DEFAULT '{}',
    events TEXT[] NOT NULL DEFAULT '{}',

    -- Webhook
    webhook_url TEXT,
    webhook_secret_hash VARCHAR(64),

    -- Display
    logo_url TEXT,
    homepage_url TEXT,
    privacy_policy_url TEXT,
    terms_url TEXT,

    -- Marketplace
    public BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suspended_at TIMESTAMPTZ,

    CHECK (owner_user_id IS NOT NULL OR owner_org_id IS NOT NULL)
);

CREATE INDEX idx_apps_owner_user ON gitchain_apps(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_apps_owner_org ON gitchain_apps(owner_org_id) WHERE owner_org_id IS NOT NULL;
CREATE INDEX idx_apps_public ON gitchain_apps(public, verified) WHERE public = TRUE;
CREATE INDEX idx_apps_client_id ON gitchain_apps(client_id);

-- =============================================================================
-- APP INSTALLATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES gitchain_apps(id) ON DELETE CASCADE,

    -- Installed by
    installer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Installed on (user account or org)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Scope of access
    -- null = all containers, array = specific container IDs
    container_ids UUID[] DEFAULT NULL,

    -- Granted permissions (subset of app.permissions)
    permissions_granted JSONB NOT NULL DEFAULT '{}',

    -- Status
    suspended BOOLEAN NOT NULL DEFAULT FALSE,
    suspended_at TIMESTAMPTZ,
    suspended_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (user_id IS NOT NULL OR org_id IS NOT NULL),
    UNIQUE(app_id, user_id) WHERE user_id IS NOT NULL,
    UNIQUE(app_id, org_id) WHERE org_id IS NOT NULL
);

CREATE INDEX idx_installations_app ON app_installations(app_id);
CREATE INDEX idx_installations_user ON app_installations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_installations_org ON app_installations(org_id) WHERE org_id IS NOT NULL;

-- =============================================================================
-- APP ACCESS TOKENS (Installation tokens)
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES app_installations(id) ON DELETE CASCADE,

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    -- Short-lived (1 hour default)
    expires_at TIMESTAMPTZ NOT NULL,

    -- Usage tracking
    last_used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_tokens_installation ON app_access_tokens(installation_id);
CREATE INDEX idx_app_tokens_hash ON app_access_tokens(token_hash) WHERE expires_at > NOW();
CREATE INDEX idx_app_tokens_expiry ON app_access_tokens(expires_at);

-- Clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_app_tokens() RETURNS void AS $$
BEGIN
    DELETE FROM app_access_tokens WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- OAUTH AUTHORIZATION CODES
-- =============================================================================
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES gitchain_apps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    code_hash VARCHAR(64) NOT NULL UNIQUE,
    redirect_uri TEXT NOT NULL,
    scopes JSONB NOT NULL DEFAULT '[]',

    -- PKCE support
    code_challenge VARCHAR(128),
    code_challenge_method VARCHAR(10),  -- 'plain' or 'S256'

    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oauth_codes_hash ON oauth_authorization_codes(code_hash) WHERE used_at IS NULL;
CREATE INDEX idx_oauth_codes_expiry ON oauth_authorization_codes(expires_at);

-- =============================================================================
-- OAUTH REFRESH TOKENS
-- =============================================================================
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES gitchain_apps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash VARCHAR(64) NOT NULL UNIQUE,
    scopes JSONB NOT NULL DEFAULT '[]',

    expires_at TIMESTAMPTZ,  -- null = never expires
    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_hash ON oauth_refresh_tokens(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_refresh_tokens_user ON oauth_refresh_tokens(user_id) WHERE revoked_at IS NULL;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if token has required scope
CREATE OR REPLACE FUNCTION token_has_scope(token_scopes JSONB, required_scope TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN token_scopes ? required_scope;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if token can access container
CREATE OR REPLACE FUNCTION token_can_access_container(
    token_container_ids UUID[],
    target_container_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- null means all containers
    IF token_container_ids IS NULL THEN
        RETURN TRUE;
    END IF;
    RETURN target_container_id = ANY(token_container_ids);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
