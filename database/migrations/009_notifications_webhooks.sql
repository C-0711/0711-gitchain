-- GitChain Migration 009: Notifications & Webhooks
-- GitHub-style notification system and webhook events

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification type
    type VARCHAR(50) NOT NULL,
    -- Types: container_pushed, pr_review_requested, pr_merged, mention,
    --        chain_anchored, compliance_failed, access_granted, invite_received,
    --        security_alert, user_followed, container_starred, container_forked

    -- Related entities
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Notification content
    title VARCHAR(255) NOT NULL,
    body TEXT,
    url VARCHAR(500),  -- Link to relevant page

    -- Metadata for rich display
    metadata JSONB DEFAULT '{}',

    -- Status
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
    WHERE read_at IS NULL AND archived_at IS NULL;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC)
    WHERE archived_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX idx_notifications_container ON notifications(container_id) WHERE container_id IS NOT NULL;
CREATE INDEX idx_notifications_org ON notifications(org_id) WHERE org_id IS NOT NULL;

-- =============================================================================
-- NOTIFICATION PREFERENCES
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Global settings
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    web_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Per-type email preferences (can override global)
    email_preferences JSONB NOT NULL DEFAULT '{
        "container_pushed": true,
        "pr_review_requested": true,
        "pr_merged": true,
        "mention": true,
        "chain_anchored": false,
        "compliance_failed": true,
        "access_granted": true,
        "invite_received": true,
        "security_alert": true,
        "user_followed": false,
        "container_starred": false,
        "container_forked": true
    }',

    -- Digest settings
    digest_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    digest_frequency VARCHAR(20) DEFAULT 'daily',  -- daily, weekly
    digest_day INTEGER DEFAULT 1,  -- 1-7 for weekly (Monday=1)
    digest_hour INTEGER DEFAULT 9,  -- 0-23 UTC

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- WEBHOOKS
-- =============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Scope (container or org level)
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Webhook configuration
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of secret
    content_type VARCHAR(50) NOT NULL DEFAULT 'application/json',

    -- Events to trigger
    events TEXT[] NOT NULL DEFAULT '{}',
    -- Events: container.created, container.updated, container.deleted,
    --         atom.created, atom.updated, atom.certified,
    --         batch.submitted, batch.anchored,
    --         member.added, member.removed, member.role_changed,
    --         pr.opened, pr.closed, pr.merged

    -- SSL verification
    ssl_verification BOOLEAN NOT NULL DEFAULT TRUE,

    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_delivery_at TIMESTAMPTZ,
    last_response_code INTEGER,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (container_id IS NOT NULL OR org_id IS NOT NULL)
);

CREATE INDEX idx_webhooks_container ON webhooks(container_id) WHERE container_id IS NOT NULL;
CREATE INDEX idx_webhooks_org ON webhooks(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_webhooks_active ON webhooks(active) WHERE active = TRUE;

-- =============================================================================
-- WEBHOOK DELIVERIES (for debugging/retry)
-- =============================================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

    -- Event details
    event VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,

    -- Delivery status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, success, failed
    response_code INTEGER,
    response_body TEXT,
    response_headers JSONB,

    -- Timing
    delivered_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Retry tracking
    attempt INTEGER NOT NULL DEFAULT 1,
    next_retry_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_deliveries_pending ON webhook_deliveries(next_retry_at)
    WHERE status = 'pending' AND next_retry_at IS NOT NULL;
CREATE INDEX idx_deliveries_recent ON webhook_deliveries(created_at DESC);

-- Cleanup old deliveries (keep 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries() RETURNS void AS $$
BEGIN
    DELETE FROM webhook_deliveries WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Create notification for multiple users (e.g., all watchers)
CREATE OR REPLACE FUNCTION notify_container_watchers(
    p_container_id UUID,
    p_type VARCHAR(50),
    p_actor_id UUID,
    p_title VARCHAR(255),
    p_body TEXT,
    p_url VARCHAR(500),
    p_metadata JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO notifications (user_id, type, actor_id, container_id, title, body, url, metadata)
    SELECT
        cw.user_id,
        p_type,
        p_actor_id,
        p_container_id,
        p_title,
        p_body,
        p_url,
        p_metadata
    FROM container_watches cw
    WHERE cw.container_id = p_container_id
      AND cw.watch_level IN ('all', 'participating')
      AND cw.user_id != COALESCE(p_actor_id, '00000000-0000-0000-0000-000000000000'::UUID);

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM notifications
    WHERE user_id = p_user_id AND read_at IS NULL AND archived_at IS NULL;
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE notifications IS 'User notifications. Consider partitioning by created_at for high-volume deployments.';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery log. Auto-cleaned after 7 days.';
COMMENT ON COLUMN webhooks.consecutive_failures IS 'Auto-disable webhook after 10 consecutive failures';
