-- Migration 011: API Audit Log
-- General audit log for API operations and access logging enhancements
-- Created: 2026-02-28

-- ============================================
-- GENERAL AUDIT LOG TABLE
-- ============================================
-- Logs all sensitive operations for compliance and debugging

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who performed the action
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- What action was performed
    action VARCHAR(100) NOT NULL,  -- e.g., 'user.login', 'container.create', 'organization.delete'

    -- Target resource
    resource_type VARCHAR(50) NOT NULL,  -- e.g., 'user', 'container', 'organization'
    resource_id VARCHAR(255) NOT NULL,    -- The ID of the affected resource

    -- Change details (for updates)
    old_value JSONB,  -- Previous state (masked sensitive data)
    new_value JSONB,  -- New state (masked sensitive data)

    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id UUID,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_time ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_request ON audit_log(request_id);

-- Comments
COMMENT ON TABLE audit_log IS 'General audit log for sensitive API operations';
COMMENT ON COLUMN audit_log.action IS 'Action identifier (e.g., user.login, container.create)';
COMMENT ON COLUMN audit_log.old_value IS 'Previous state before change (sensitive data masked)';
COMMENT ON COLUMN audit_log.new_value IS 'New state after change (sensitive data masked)';

-- ============================================
-- ENHANCE ACCESS_LOG TABLE
-- ============================================
-- Add missing columns if the table exists but is incomplete

-- Add request_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'access_log' AND column_name = 'request_id'
    ) THEN
        ALTER TABLE access_log ADD COLUMN request_id UUID;
        CREATE INDEX IF NOT EXISTS idx_access_log_request ON access_log(request_id);
    END IF;
END $$;

-- Add api_key_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'access_log' AND column_name = 'api_key_id'
    ) THEN
        ALTER TABLE access_log ADD COLUMN api_key_id UUID REFERENCES personal_access_tokens(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_access_log_api_key ON access_log(api_key_id);
    END IF;
END $$;

-- Add query_params if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'access_log' AND column_name = 'query_params'
    ) THEN
        ALTER TABLE access_log ADD COLUMN query_params JSONB;
    END IF;
END $$;

-- ============================================
-- CLEANUP POLICY (optional, for retention)
-- ============================================
-- This is a comment for manual implementation of retention policies
-- Consider adding:
--   - Cron job to delete access_log entries older than 90 days
--   - Archive audit_log entries older than 1 year to cold storage
--   - Keep audit_log indefinitely for compliance

-- Example retention function (run via cron):
-- DELETE FROM access_log WHERE created_at < NOW() - INTERVAL '90 days';

COMMENT ON TABLE access_log IS 'API request access log with 90-day retention';
