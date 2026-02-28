-- GitChain Migration 007: Social Features (Stars, Watches, Forks)
-- GitHub-inspired social engagement features

-- =============================================================================
-- CONTAINER STARS
-- =============================================================================
CREATE TABLE IF NOT EXISTS container_stars (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    starred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, container_id)
);

-- Indexes for stars
CREATE INDEX idx_stars_container ON container_stars(container_id);
CREATE INDEX idx_stars_user ON container_stars(user_id);
CREATE INDEX idx_stars_recent ON container_stars(starred_at DESC);

-- =============================================================================
-- CONTAINER WATCHES
-- =============================================================================
CREATE TYPE watch_level AS ENUM ('all', 'participating', 'mentions', 'ignore');

CREATE TABLE IF NOT EXISTS container_watches (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    watch_level watch_level NOT NULL DEFAULT 'participating',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, container_id)
);

-- Indexes for watches
CREATE INDEX idx_watches_container ON container_watches(container_id);
CREATE INDEX idx_watches_user ON container_watches(user_id);
CREATE INDEX idx_watches_level ON container_watches(watch_level) WHERE watch_level != 'ignore';

-- =============================================================================
-- CONTAINER FORKS
-- =============================================================================
-- Add fork tracking to containers table
ALTER TABLE containers ADD COLUMN IF NOT EXISTS forked_from_id UUID REFERENCES containers(id) ON DELETE SET NULL;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS fork_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS star_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS watch_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_containers_forked_from ON containers(forked_from_id) WHERE forked_from_id IS NOT NULL;
CREATE INDEX idx_containers_stars ON containers(star_count DESC);
CREATE INDEX idx_containers_forks ON containers(fork_count DESC);

-- =============================================================================
-- USER FOLLOWERS (GitHub-style)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Add follower counts to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;

-- =============================================================================
-- TRIGGERS FOR DENORMALIZED COUNTS
-- =============================================================================

-- Star count trigger
CREATE OR REPLACE FUNCTION update_star_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE containers SET star_count = star_count + 1 WHERE id = NEW.container_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE containers SET star_count = star_count - 1 WHERE id = OLD.container_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_star_count ON container_stars;
CREATE TRIGGER trigger_star_count
    AFTER INSERT OR DELETE ON container_stars
    FOR EACH ROW EXECUTE FUNCTION update_star_count();

-- Watch count trigger
CREATE OR REPLACE FUNCTION update_watch_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.watch_level != 'ignore' THEN
            UPDATE containers SET watch_count = watch_count + 1 WHERE id = NEW.container_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.watch_level != 'ignore' THEN
            UPDATE containers SET watch_count = watch_count - 1 WHERE id = OLD.container_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.watch_level = 'ignore' AND NEW.watch_level != 'ignore' THEN
            UPDATE containers SET watch_count = watch_count + 1 WHERE id = NEW.container_id;
        ELSIF OLD.watch_level != 'ignore' AND NEW.watch_level = 'ignore' THEN
            UPDATE containers SET watch_count = watch_count - 1 WHERE id = NEW.container_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_watch_count ON container_watches;
CREATE TRIGGER trigger_watch_count
    AFTER INSERT OR DELETE OR UPDATE ON container_watches
    FOR EACH ROW EXECUTE FUNCTION update_watch_count();

-- Fork count trigger
CREATE OR REPLACE FUNCTION update_fork_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.forked_from_id IS NOT NULL THEN
        UPDATE containers SET fork_count = fork_count + 1 WHERE id = NEW.forked_from_id;
    ELSIF TG_OP = 'DELETE' AND OLD.forked_from_id IS NOT NULL THEN
        UPDATE containers SET fork_count = fork_count - 1 WHERE id = OLD.forked_from_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fork_count ON containers;
CREATE TRIGGER trigger_fork_count
    AFTER INSERT OR DELETE ON containers
    FOR EACH ROW EXECUTE FUNCTION update_fork_count();

-- Follower count triggers
CREATE OR REPLACE FUNCTION update_follower_counts() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
        UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_follower_counts ON user_follows;
CREATE TRIGGER trigger_follower_counts
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- =============================================================================
-- ACTIVITY EVENTS (for activity feed)
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for activity feed queries
CREATE INDEX idx_activity_actor ON activity_events(actor_id, created_at DESC);
CREATE INDEX idx_activity_org ON activity_events(org_id, created_at DESC) WHERE org_id IS NOT NULL;
CREATE INDEX idx_activity_container ON activity_events(container_id, created_at DESC) WHERE container_id IS NOT NULL;
CREATE INDEX idx_activity_type ON activity_events(event_type, created_at DESC);
CREATE INDEX idx_activity_recent ON activity_events(created_at DESC);

-- Partition hint: consider partitioning by month for high-volume deployments
COMMENT ON TABLE activity_events IS 'Activity feed events. Consider partitioning by created_at for scale.';
