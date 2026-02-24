-- ===========================================
-- GitChain Migration: Company Model Enhancement
-- Created: 2026-02-24
-- Description: Enhances organization (company) model with:
--   - Updated plans (free/pro/team/business/enterprise)
--   - Team-level container access
--   - Container type patterns
--   - Improved audit logging
-- ===========================================

-- ===========================================
-- UPDATE ORGANIZATIONS (COMPANIES)
-- ===========================================

-- Add company-specific settings
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS display_theme JSONB DEFAULT '{}'::jsonb;

-- Update plan types
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE organizations
ADD CONSTRAINT organizations_plan_check
CHECK (plan IN ('free', 'pro', 'team', 'business', 'enterprise'));

-- Add usage tracking
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS container_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Plan limits (stored in settings JSONB, but also add explicit columns for querying)
COMMENT ON COLUMN organizations.max_members IS 'free:3, pro:10, team:50, business:500, enterprise:unlimited';
COMMENT ON COLUMN organizations.max_private_containers IS 'free:10, pro:100, team:1000, business:10000, enterprise:unlimited';
COMMENT ON COLUMN organizations.max_storage_gb IS 'free:1, pro:10, team:100, business:1000, enterprise:unlimited';

-- ===========================================
-- TEAM-LEVEL CONTAINER ACCESS
-- ===========================================

-- Allow teams to have access to containers
CREATE TABLE IF NOT EXISTS team_container_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES organization_teams(id) ON DELETE CASCADE,
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'read',  -- maintainer, editor, reviewer, viewer
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(team_id, container_id)
);

CREATE INDEX IF NOT EXISTS idx_team_container_access_team
ON team_container_access(team_id);

CREATE INDEX IF NOT EXISTS idx_team_container_access_container
ON team_container_access(container_id);

-- ===========================================
-- CONTAINER TYPE EXTENSIONS
-- ===========================================

-- Add explicit container_type column for better querying
ALTER TABLE containers
ADD COLUMN IF NOT EXISTS container_type VARCHAR(50);

-- Container types: product, session, project, legal, tax, marketing, docs, custom
-- Pattern: {company}:{type}:{identifier...}

COMMENT ON COLUMN containers.container_type IS 'product, session, project, legal, tax, marketing, docs, custom';

-- Add owner_type to track ownership level
ALTER TABLE containers
ADD COLUMN IF NOT EXISTS owner_type VARCHAR(20) DEFAULT 'user';

-- owner_type: user, team, org
COMMENT ON COLUMN containers.owner_type IS 'user, team, org - determines ownership level';

-- Add team ownership
ALTER TABLE containers
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES organization_teams(id);

CREATE INDEX IF NOT EXISTS idx_containers_team
ON containers(team_id) WHERE deleted_at IS NULL;

-- ===========================================
-- EXTENDED VISIBILITY LEVELS
-- ===========================================

-- Update visibility check constraint
ALTER TABLE containers
DROP CONSTRAINT IF EXISTS containers_visibility_check;

ALTER TABLE containers
ADD CONSTRAINT containers_visibility_check
CHECK (visibility IN ('private', 'org', 'public_unlisted', 'public'));

-- private: Only owner + explicitly shared
-- org: Anyone in company can view
-- public_unlisted: Anyone with link can view
-- public: Discoverable in search/browse

-- ===========================================
-- INVITATION IMPROVEMENTS
-- ===========================================

-- Add team assignment to invites
ALTER TABLE organization_invites
ADD COLUMN IF NOT EXISTS team_ids UUID[] DEFAULT '{}';

-- Add bulk invite support
ALTER TABLE organization_invites
ADD COLUMN IF NOT EXISTS batch_id UUID;

-- ===========================================
-- AUDIT LOG IMPROVEMENTS
-- ===========================================

-- Add more detailed action types
ALTER TABLE organization_audit_log
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for action filtering
CREATE INDEX IF NOT EXISTS idx_org_audit_action
ON organization_audit_log(action);

-- ===========================================
-- CONTAINER ACCESS HELPER
-- ===========================================

-- Function to check if user has container access
CREATE OR REPLACE FUNCTION user_has_container_access(
    p_user_id UUID,
    p_container_id UUID,
    p_min_role VARCHAR DEFAULT 'viewer'
) RETURNS BOOLEAN AS $$
DECLARE
    v_container RECORD;
    v_role_level INTEGER;
    v_min_level INTEGER;
    v_user_role VARCHAR;
BEGIN
    -- Get role level mapping
    SELECT CASE p_min_role
        WHEN 'maintainer' THEN 4
        WHEN 'editor' THEN 3
        WHEN 'reviewer' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END INTO v_min_level;

    -- Get container info
    SELECT c.*,
           c.created_by = p_user_id AS is_owner,
           c.org_id,
           c.team_id,
           c.visibility
    INTO v_container
    FROM containers c
    WHERE c.id = p_container_id AND c.deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Owner always has full access
    IF v_container.is_owner THEN
        RETURN TRUE;
    END IF;

    -- Check public visibility
    IF v_container.visibility = 'public' OR v_container.visibility = 'public_unlisted' THEN
        IF v_min_level <= 1 THEN -- viewer
            RETURN TRUE;
        END IF;
    END IF;

    -- Check org membership for org-visible containers
    IF v_container.visibility = 'org' AND v_container.org_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM organization_members
            WHERE org_id = v_container.org_id
            AND user_id = p_user_id
            AND status = 'active'
        ) THEN
            IF v_min_level <= 1 THEN -- viewer
                RETURN TRUE;
            END IF;
        END IF;
    END IF;

    -- Check direct collaborator access
    SELECT role INTO v_user_role
    FROM container_collaborators
    WHERE container_id = p_container_id AND user_id = p_user_id;

    IF v_user_role IS NOT NULL THEN
        SELECT CASE v_user_role
            WHEN 'admin' THEN 4
            WHEN 'write' THEN 3
            WHEN 'read' THEN 1
            ELSE 0
        END INTO v_role_level;

        IF v_role_level >= v_min_level THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- Check team access
    IF EXISTS (
        SELECT 1 FROM team_container_access tca
        JOIN team_members tm ON tca.team_id = tm.team_id
        WHERE tca.container_id = p_container_id
        AND tm.user_id = p_user_id
        AND CASE tca.role
            WHEN 'maintainer' THEN 4
            WHEN 'editor' THEN 3
            WHEN 'reviewer' THEN 2
            WHEN 'viewer' THEN 1
            ELSE 0
        END >= v_min_level
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check org-level access (admins can access org containers)
    IF v_container.org_id IS NOT NULL THEN
        IF user_has_org_role(p_user_id, v_container.org_id, 'admin') THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- USAGE TRACKING TRIGGERS
-- ===========================================

-- Update org member count
CREATE OR REPLACE FUNCTION update_org_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE organizations SET member_count = member_count + 1 WHERE id = NEW.org_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE organizations SET member_count = member_count - 1 WHERE id = OLD.org_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE organizations SET member_count = member_count + 1 WHERE id = NEW.org_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE organizations SET member_count = member_count - 1 WHERE id = NEW.org_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS org_member_count_trigger ON organization_members;
CREATE TRIGGER org_member_count_trigger AFTER INSERT OR UPDATE OR DELETE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_org_member_count();

-- Update org container count
CREATE OR REPLACE FUNCTION update_org_container_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.org_id IS NOT NULL THEN
        UPDATE organizations SET container_count = container_count + 1 WHERE id = NEW.org_id;
    ELSIF TG_OP = 'DELETE' AND OLD.org_id IS NOT NULL THEN
        UPDATE organizations SET container_count = container_count - 1 WHERE id = OLD.org_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.org_id IS DISTINCT FROM NEW.org_id THEN
            IF OLD.org_id IS NOT NULL THEN
                UPDATE organizations SET container_count = container_count - 1 WHERE id = OLD.org_id;
            END IF;
            IF NEW.org_id IS NOT NULL THEN
                UPDATE organizations SET container_count = container_count + 1 WHERE id = NEW.org_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS org_container_count_trigger ON containers;
CREATE TRIGGER org_container_count_trigger AFTER INSERT OR UPDATE OR DELETE ON containers
    FOR EACH ROW EXECUTE FUNCTION update_org_container_count();

-- ===========================================
-- IMPORT JOBS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Job info
    type VARCHAR(50) NOT NULL,  -- bmcat, csv, json, file
    source_filename VARCHAR(255),
    source_size BIGINT,

    -- Progress
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,

    -- Results
    created_containers UUID[] DEFAULT '{}',
    errors JSONB DEFAULT '[]'::jsonb,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_org ON import_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);

-- ===========================================
-- DONE
-- ===========================================
