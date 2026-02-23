-- ============================================================================
-- 0711-GitChain: Product Container Schema Extension
-- THE STANDARD FOR ELECTRICAL INDUSTRY PRODUCT DATA (ETIM)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

CREATE TYPE source_type AS ENUM (
  'manufacturer',
  'classification', 
  'certification',
  'ai_verified',
  'ai_generated',
  'customer_extension',
  'builder_output',
  'community'
);

CREATE TYPE trust_level AS ENUM (
  'highest',    -- 1
  'high',       -- 2
  'certified',  -- 3
  'verified',   -- 4
  'medium',     -- 5
  'customer',   -- 6
  'generated',  -- 7
  'community'   -- 8
);

CREATE TYPE contributor_role AS ENUM (
  'manufacturer',
  'classifier',
  'certifier',
  'ai_agent',
  'customer',
  'builder',
  'user'
);

CREATE TYPE verification_method AS ENUM (
  'human_review',
  'automated',
  'cross_reference',
  'multi_source'
);

CREATE TYPE extraction_method AS ENUM (
  'ocr',
  'pdf_parse',
  'table_extraction',
  'nlp',
  'manual'
);

-- ----------------------------------------------------------------------------
-- CONTRIBUTORS - Entities that add data to containers
-- ----------------------------------------------------------------------------

CREATE TABLE contributors (
  id TEXT PRIMARY KEY,                          -- "bombas@0711.io", "bosch", "amazon-de"
  name TEXT NOT NULL,
  role contributor_role NOT NULL,
  organization TEXT,
  email TEXT,
  public_key TEXT,                              -- For signing contributions
  
  -- Statistics
  total_contributions INTEGER DEFAULT 0,
  verified_contributions INTEGER DEFAULT 0,
  containers_contributed_to INTEGER DEFAULT 0,
  
  -- Trust modifier (-2 to +2, affects final trust calculation)
  trust_modifier INTEGER DEFAULT 0 CHECK (trust_modifier BETWEEN -2 AND 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributors_role ON contributors(role);
CREATE INDEX idx_contributors_org ON contributors(organization);

-- ----------------------------------------------------------------------------
-- CONTAINER_LAYERS - Grouped contributions from one source
-- ----------------------------------------------------------------------------

CREATE TABLE container_layers (
  id TEXT NOT NULL,                             -- "001-etim", "002-ai-enrichment"
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  type source_type NOT NULL,
  contributor_id TEXT NOT NULL REFERENCES contributors(id),
  trust_level trust_level NOT NULL,
  
  -- Layer properties
  requires_verification BOOLEAN DEFAULT false,
  schema_version TEXT,
  description TEXT,
  
  -- Git reference
  commit_hash TEXT NOT NULL,
  
  -- Statistics
  atom_count INTEGER DEFAULT 0,
  verified_count INTEGER DEFAULT 0,
  
  -- Timestamps  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (container_id, id)
);

CREATE INDEX idx_layers_contributor ON container_layers(contributor_id);
CREATE INDEX idx_layers_type ON container_layers(type);
CREATE INDEX idx_layers_trust ON container_layers(trust_level);

-- ----------------------------------------------------------------------------
-- CONTAINER_ATOMS - The smallest unit of data with full provenance
-- ----------------------------------------------------------------------------

CREATE TABLE container_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  layer_id TEXT NOT NULL,
  
  -- Field identification
  field_path TEXT NOT NULL,                     -- "cop_a7w35", "dimensions.height", "etim.EF000007"
  field_name TEXT,                              -- Human-readable: "COP bei A7/W35"
  
  -- Value
  value JSONB NOT NULL,                         -- The actual value (any JSON type)
  value_type TEXT NOT NULL,                     -- "string", "number", "boolean", "array", "object"
  unit TEXT,                                    -- "W/W", "mm", "kg"
  lang TEXT,                                    -- "de", "en" for text values
  
  -- Source (REQUIRED)
  source_type source_type NOT NULL,
  contributor_id TEXT NOT NULL REFERENCES contributors(id),
  trust_level trust_level NOT NULL,
  
  -- Git reference
  commit_hash TEXT NOT NULL,
  
  -- Citation (required for ai_generated, ai_verified)
  citation_document TEXT,                       -- "0711:document:bosch:bodbsp_123:v1"
  citation_page INTEGER,
  citation_section TEXT,
  citation_excerpt TEXT,
  citation_confidence NUMERIC(4,3),             -- 0.000 - 1.000
  citation_method extraction_method,
  
  -- Verification (optional, upgrades trust)
  verified_by TEXT REFERENCES contributors(id),
  verified_at TIMESTAMPTZ,
  verification_method verification_method,
  verification_notes TEXT,
  
  -- Supersession (for audit trail)
  supersedes UUID[],                            -- Previous atom IDs this replaces
  superseded_by UUID,                           -- Atom that replaced this one
  is_current BOOLEAN DEFAULT true,              -- Quick filter for current values
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_layer FOREIGN KEY (container_id, layer_id) 
    REFERENCES container_layers(container_id, id) ON DELETE CASCADE,
  CONSTRAINT valid_confidence CHECK (citation_confidence IS NULL OR citation_confidence BETWEEN 0 AND 1)
);

-- Performance indexes
CREATE INDEX idx_atoms_container ON container_atoms(container_id);
CREATE INDEX idx_atoms_container_field ON container_atoms(container_id, field_path);
CREATE INDEX idx_atoms_container_current ON container_atoms(container_id, is_current) WHERE is_current = true;
CREATE INDEX idx_atoms_layer ON container_atoms(container_id, layer_id);
CREATE INDEX idx_atoms_contributor ON container_atoms(contributor_id);
CREATE INDEX idx_atoms_trust ON container_atoms(trust_level);
CREATE INDEX idx_atoms_source ON container_atoms(source_type);
CREATE INDEX idx_atoms_verified ON container_atoms(verified_by) WHERE verified_by IS NOT NULL;
CREATE INDEX idx_atoms_citation_doc ON container_atoms(citation_document) WHERE citation_document IS NOT NULL;

-- GIN index for JSONB value queries
CREATE INDEX idx_atoms_value ON container_atoms USING GIN (value);

-- ----------------------------------------------------------------------------
-- ETIM_FEATURES - Specialized table for ETIM feature atoms
-- ----------------------------------------------------------------------------

CREATE TABLE etim_features (
  atom_id UUID PRIMARY KEY REFERENCES container_atoms(id) ON DELETE CASCADE,
  
  -- ETIM identifiers
  etim_class_code TEXT NOT NULL,                -- "EC012034"
  etim_feature_code TEXT NOT NULL,              -- "EF000007"
  etim_feature_name TEXT NOT NULL,              -- "Nennleistung"
  
  -- ETIM value (for coded values)
  etim_value_code TEXT,                         -- "EV000123"
  etim_unit_code TEXT,                          -- "EU570001"
  
  -- ETIM version
  etim_version TEXT NOT NULL                    -- "9.0"
);

CREATE INDEX idx_etim_class ON etim_features(etim_class_code);
CREATE INDEX idx_etim_feature ON etim_features(etim_feature_code);
CREATE INDEX idx_etim_version ON etim_features(etim_version);

-- ----------------------------------------------------------------------------
-- PRODUCT_IDENTITY - Immutable product core data
-- ----------------------------------------------------------------------------

CREATE TABLE product_identity (
  container_id UUID PRIMARY KEY REFERENCES containers(id) ON DELETE CASCADE,
  
  -- Primary identifiers (immutable once set)
  snr TEXT NOT NULL,                            -- Supplier number (main ID)
  manufacturer TEXT NOT NULL,                   -- Namespace/manufacturer
  
  -- Secondary identifiers
  gtin TEXT,                                    -- EAN/GTIN
  manufacturer_aid TEXT,                        -- Manufacturer article number
  
  -- ETIM classification
  etim_class_code TEXT,
  etim_class_name TEXT,
  etim_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Immutability constraint (trigger prevents updates to snr, manufacturer)
  UNIQUE (manufacturer, snr)
);

CREATE INDEX idx_product_snr ON product_identity(snr);
CREATE INDEX idx_product_gtin ON product_identity(gtin) WHERE gtin IS NOT NULL;
CREATE INDEX idx_product_etim ON product_identity(etim_class_code) WHERE etim_class_code IS NOT NULL;

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Update layer atom counts
CREATE OR REPLACE FUNCTION update_layer_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE container_layers 
    SET atom_count = atom_count + 1,
        updated_at = NOW()
    WHERE container_id = NEW.container_id AND id = NEW.layer_id;
    
    UPDATE contributors
    SET total_contributions = total_contributions + 1,
        updated_at = NOW()
    WHERE id = NEW.contributor_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE container_layers
    SET atom_count = atom_count - 1,
        updated_at = NOW()
    WHERE container_id = OLD.container_id AND id = OLD.layer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_layer_counts
AFTER INSERT OR DELETE ON container_atoms
FOR EACH ROW EXECUTE FUNCTION update_layer_counts();

-- Update verified counts
CREATE OR REPLACE FUNCTION update_verified_counts() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified_by IS NOT NULL AND (OLD.verified_by IS NULL OR TG_OP = 'INSERT') THEN
    UPDATE container_layers
    SET verified_count = verified_count + 1,
        updated_at = NOW()
    WHERE container_id = NEW.container_id AND id = NEW.layer_id;
    
    UPDATE contributors
    SET verified_contributions = verified_contributions + 1,
        updated_at = NOW()
    WHERE id = NEW.contributor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_verified_counts
AFTER INSERT OR UPDATE OF verified_by ON container_atoms
FOR EACH ROW EXECUTE FUNCTION update_verified_counts();

-- Prevent modification of product identity core fields
CREATE OR REPLACE FUNCTION prevent_identity_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.snr != NEW.snr OR OLD.manufacturer != NEW.manufacturer THEN
    RAISE EXCEPTION 'Cannot modify immutable product identity (snr, manufacturer)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_immutable_identity
BEFORE UPDATE ON product_identity
FOR EACH ROW EXECUTE FUNCTION prevent_identity_change();

-- ----------------------------------------------------------------------------
-- VIEWS
-- ----------------------------------------------------------------------------

-- Current atoms only (most common query pattern)
CREATE VIEW current_atoms AS
SELECT * FROM container_atoms WHERE is_current = true;

-- Atoms with contributor info
CREATE VIEW atoms_with_contributors AS
SELECT 
  a.*,
  c.name as contributor_name,
  c.role as contributor_role,
  c.organization as contributor_org
FROM container_atoms a
JOIN contributors c ON a.contributor_id = c.id;

-- Container summary with layer info
CREATE VIEW container_summary AS
SELECT 
  c.id,
  c.container_id as container_id_string,
  c.version,
  pi.snr,
  pi.manufacturer,
  pi.etim_class_code,
  COUNT(DISTINCT cl.id) as layer_count,
  COUNT(DISTINCT ca.id) as total_atoms,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.verified_by IS NOT NULL) as verified_atoms,
  COUNT(DISTINCT ca.contributor_id) as contributor_count
FROM containers c
LEFT JOIN product_identity pi ON c.id = pi.container_id
LEFT JOIN container_layers cl ON c.id = cl.container_id
LEFT JOIN container_atoms ca ON c.id = ca.container_id AND ca.is_current = true
GROUP BY c.id, pi.snr, pi.manufacturer, pi.etim_class_code;

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------

-- Get all current atoms for a container as JSONB
CREATE OR REPLACE FUNCTION get_container_data(p_container_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(
    field_path,
    jsonb_build_object(
      'value', value,
      'unit', unit,
      'source', jsonb_build_object(
        'type', source_type,
        'contributor_id', contributor_id
      ),
      'trust', trust_level,
      'commit', commit_hash,
      'citation', CASE WHEN citation_document IS NOT NULL THEN
        jsonb_build_object(
          'document', citation_document,
          'page', citation_page,
          'confidence', citation_confidence
        )
      ELSE NULL END,
      'verified_by', verified_by,
      'created_at', created_at
    )
  )
  INTO result
  FROM container_atoms
  WHERE container_id = p_container_id AND is_current = true;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Resolve conflicts: get winning atom for a field (highest trust wins)
CREATE OR REPLACE FUNCTION get_winning_atom(
  p_container_id UUID,
  p_field_path TEXT
) RETURNS container_atoms AS $$
DECLARE
  result container_atoms;
BEGIN
  SELECT * INTO result
  FROM container_atoms
  WHERE container_id = p_container_id 
    AND field_path = p_field_path
    AND is_current = true
  ORDER BY 
    CASE trust_level
      WHEN 'highest' THEN 1
      WHEN 'high' THEN 2
      WHEN 'certified' THEN 3
      WHEN 'verified' THEN 4
      WHEN 'medium' THEN 5
      WHEN 'customer' THEN 6
      WHEN 'generated' THEN 7
      WHEN 'community' THEN 8
    END,
    created_at DESC
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- SAMPLE DATA: Register core contributors
-- ----------------------------------------------------------------------------

INSERT INTO contributors (id, name, role, organization) VALUES
  ('system', '0711 GitChain System', 'ai_agent', '0711 Intelligence'),
  ('bombas@0711.io', 'Fleet Admiral Bombas', 'ai_agent', '0711 Intelligence'),
  ('bosch', 'Robert Bosch GmbH', 'manufacturer', 'Bosch'),
  ('etim-international', 'ETIM International', 'classifier', 'ETIM')
ON CONFLICT (id) DO NOTHING;
