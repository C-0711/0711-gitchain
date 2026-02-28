-- GitChain Migration 010: SSO Sessions & Identity Providers
-- Enterprise SSO with SAML 2.0 and OIDC support

-- =============================================================================
-- SSO IDENTITY PROVIDERS (detailed config per org)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sso_identity_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Provider type
    provider_type VARCHAR(20) NOT NULL,  -- saml, oidc
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,

    -- Status
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,

    -- SAML Configuration
    saml_entity_id TEXT,
    saml_sso_url TEXT,
    saml_slo_url TEXT,
    saml_certificate TEXT,  -- X.509 certificate (PEM format)
    saml_signature_algorithm VARCHAR(50) DEFAULT 'RSA-SHA256',
    saml_digest_algorithm VARCHAR(50) DEFAULT 'SHA256',
    saml_want_assertions_signed BOOLEAN DEFAULT TRUE,
    saml_want_response_signed BOOLEAN DEFAULT TRUE,

    -- OIDC Configuration
    oidc_issuer TEXT,
    oidc_client_id TEXT,
    oidc_client_secret_encrypted TEXT,  -- Encrypted with org key
    oidc_authorization_endpoint TEXT,
    oidc_token_endpoint TEXT,
    oidc_userinfo_endpoint TEXT,
    oidc_jwks_uri TEXT,
    oidc_scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],

    -- Attribute Mapping
    attribute_mapping JSONB NOT NULL DEFAULT '{
        "email": "email",
        "name": "name",
        "firstName": "given_name",
        "lastName": "family_name",
        "groups": "groups"
    }',

    -- Group/Role Mapping
    group_mapping JSONB DEFAULT '{}',  -- {"Engineering": "maintainer", "Admins": "admin"}
    default_role VARCHAR(20) DEFAULT 'member',

    -- Provisioning
    jit_provisioning BOOLEAN DEFAULT TRUE,  -- Just-in-time user creation
    auto_update_profile BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(org_id, slug)
);

CREATE INDEX idx_sso_idp_org ON sso_identity_providers(org_id) WHERE enabled = TRUE;

-- =============================================================================
-- SSO SESSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS sso_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idp_id UUID NOT NULL REFERENCES sso_identity_providers(id) ON DELETE CASCADE,

    -- Session identifiers
    session_index VARCHAR(255),  -- SAML SessionIndex
    name_id VARCHAR(255),        -- SAML NameID / OIDC sub

    -- Token storage (for OIDC refresh)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    id_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Session info
    ip_address INET,
    user_agent TEXT,

    -- Status
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_sso_sessions_user ON sso_sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_sso_sessions_idp ON sso_sessions(idp_id);
CREATE INDEX idx_sso_sessions_expiry ON sso_sessions(expires_at) WHERE revoked_at IS NULL;

-- =============================================================================
-- SSO LOGIN STATES (CSRF protection)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sso_login_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idp_id UUID NOT NULL REFERENCES sso_identity_providers(id) ON DELETE CASCADE,

    state VARCHAR(64) NOT NULL UNIQUE,
    nonce VARCHAR(64),  -- For OIDC
    code_verifier VARCHAR(128),  -- For PKCE
    redirect_uri TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
    used_at TIMESTAMPTZ
);

CREATE INDEX idx_sso_states_state ON sso_login_states(state) WHERE used_at IS NULL;

-- Cleanup expired states
CREATE OR REPLACE FUNCTION cleanup_sso_states() RETURNS void AS $$
BEGIN
    DELETE FROM sso_login_states WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DOMAIN VERIFICATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS domain_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    domain VARCHAR(255) NOT NULL,
    verification_method VARCHAR(20) NOT NULL,  -- dns_txt, dns_cname, meta_tag
    verification_token VARCHAR(64) NOT NULL,

    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    last_check_at TIMESTAMPTZ,
    check_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(org_id, domain)
);

CREATE INDEX idx_domain_verifications_org ON domain_verifications(org_id);
CREATE INDEX idx_domain_verifications_domain ON domain_verifications(domain) WHERE verified = TRUE;

-- =============================================================================
-- IP ALLOWLISTING
-- =============================================================================
CREATE TABLE IF NOT EXISTS ip_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    cidr CIDR NOT NULL,
    description VARCHAR(255),

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(org_id, cidr)
);

CREATE INDEX idx_ip_allowlist_org ON ip_allowlist(org_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if IP is allowed for org
CREATE OR REPLACE FUNCTION is_ip_allowed(p_org_id UUID, p_ip INET) RETURNS BOOLEAN AS $$
DECLARE
    has_allowlist BOOLEAN;
    is_allowed BOOLEAN;
BEGIN
    -- Check if org has any IP restrictions
    SELECT EXISTS (
        SELECT 1 FROM ip_allowlist WHERE org_id = p_org_id
    ) INTO has_allowlist;

    IF NOT has_allowlist THEN
        RETURN TRUE;  -- No restrictions
    END IF;

    -- Check if IP is in allowlist
    SELECT EXISTS (
        SELECT 1 FROM ip_allowlist
        WHERE org_id = p_org_id AND p_ip <<= cidr
    ) INTO is_allowed;

    RETURN is_allowed;
END;
$$ LANGUAGE plpgsql;

-- Get org for email domain (for SSO routing)
CREATE OR REPLACE FUNCTION get_org_for_email_domain(p_email VARCHAR) RETURNS UUID AS $$
DECLARE
    v_domain VARCHAR;
    v_org_id UUID;
BEGIN
    -- Extract domain from email
    v_domain := split_part(p_email, '@', 2);

    -- Find org with verified domain
    SELECT dv.org_id INTO v_org_id
    FROM domain_verifications dv
    JOIN organizations o ON dv.org_id = o.id
    WHERE dv.domain = v_domain
      AND dv.verified = TRUE
      AND o.deleted_at IS NULL
    LIMIT 1;

    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql;
