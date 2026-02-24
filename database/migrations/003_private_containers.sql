-- ===========================================
-- GitChain Migration: Private Containers
-- Created: 2026-02-24
-- ===========================================

-- Add visibility to containers (override namespace default)
ALTER TABLE containers 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';

-- Add description to containers
ALTER TABLE containers 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add stars/forks count (GitHub-style)
ALTER TABLE containers 
ADD COLUMN IF NOT EXISTS star_count INTEGER DEFAULT 0;
ALTER TABLE containers 
ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;

-- Index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_containers_visibility 
ON containers(visibility) WHERE deleted_at IS NULL;

-- ===========================================
-- CONTAINER COLLABORATORS (like GitHub)
-- ===========================================

CREATE TABLE IF NOT EXISTS container_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'read',  -- admin, write, read
    invited_by UUID REFERENCES users(id),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(container_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_container 
ON container_collaborators(container_id);

CREATE INDEX IF NOT EXISTS idx_collaborators_user 
ON container_collaborators(user_id);

-- ===========================================
-- CONTAINER STARS (GitHub-style)
-- ===========================================

CREATE TABLE IF NOT EXISTS container_stars (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, container_id)
);

CREATE INDEX IF NOT EXISTS idx_stars_container 
ON container_stars(container_id);

-- Update star count trigger
CREATE OR REPLACE FUNCTION update_star_count()
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

DROP TRIGGER IF EXISTS star_count_trigger ON container_stars;
CREATE TRIGGER star_count_trigger AFTER INSERT OR DELETE ON container_stars
    FOR EACH ROW EXECUTE FUNCTION update_star_count();

-- ===========================================
-- DONE
-- ===========================================
