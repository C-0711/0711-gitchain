#!/usr/bin/env python3
"""Import test container 8738208680 into GitChain database."""

import json
import psycopg2
from psycopg2.extras import Json
from datetime import datetime
import uuid

# Database connection
conn = psycopg2.connect(
    host="localhost",
    port=5440,
    database="gitchain",
    user="gitchain",
    password="gitchain2026"
)
cur = conn.cursor()

# Load container JSON
with open('/home/christoph.bertsch/0711/0711-gitchain/test-containers/container_8738208680.json', 'r') as f:
    container = json.load(f)

snr = container['identifier']
container_id_str = f"0711:product:bosch:{snr}"

print(f"Importing container: {container_id_str}")

# Check if container already exists
cur.execute("SELECT id FROM containers WHERE container_id = %s", (container_id_str,))
existing = cur.fetchone()

if existing:
    print(f"Container already exists with id {existing[0]}, deleting...")
    cur.execute("DELETE FROM containers WHERE container_id = %s", (container_id_str,))
    conn.commit()

# Get or create namespace
cur.execute("SELECT id FROM namespaces WHERE name = 'bosch'")
ns_row = cur.fetchone()
if ns_row:
    namespace_id = ns_row[0]
else:
    cur.execute("""
        INSERT INTO namespaces (name, display_name, description, is_verified)
        VALUES ('bosch', 'Bosch Thermotechnik', 'Bosch heating and cooling products', true)
        RETURNING id
    """)
    namespace_id = cur.fetchone()[0]

# Create container
container_uuid = str(uuid.uuid4())
cur.execute("""
    INSERT INTO containers (id, container_id, type, namespace_id, namespace, identifier, version, data, meta)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id
""", (
    container_uuid,
    container_id_str,
    'product',
    namespace_id,
    'bosch',
    snr,
    1,
    Json({
        'name': container['identity']['name'],
        'description': container['identity']['description_short'],
        'etim_class': container['classification']['etim']['class_code'],
        'etim_class_name': container['classification']['etim']['class_name']
    }),
    Json({
        'manufacturer': container['identity']['manufacturer'],
        'brand': container['identity']['brand'],
        'product_series': container['identity']['product_series'],
        'installation': container['identity']['installation']
    })
))
print(f"Created container: {container_uuid}")

# Create product_identity
cur.execute("""
    INSERT INTO product_identity (container_id, snr, manufacturer, etim_class_code, etim_class_name)
    VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (container_id) DO UPDATE SET
        snr = EXCLUDED.snr,
        manufacturer = EXCLUDED.manufacturer,
        etim_class_code = EXCLUDED.etim_class_code,
        etim_class_name = EXCLUDED.etim_class_name
""", (
    container_uuid,
    snr,
    'bosch',
    container['classification']['etim']['class_code'],
    container['classification']['etim']['class_name']
))

# Create layers
layers = [
    ('000-manufacturer', 'Bosch Original', 'manufacturer', 'bosch-thermotechnik', 'highest'),
    ('001-etim', 'ETIM Klassifikation', 'classification', 'etim-international', 'high'),
    ('002-datasheet', 'Datenblatt-Extraktion', 'ai_generated', '0711-audit-pipeline', 'medium')
]

for layer_id, name, layer_type, contributor_id, trust in layers:
    # Ensure contributor exists
    cur.execute("""
        INSERT INTO contributors (id, name, type, trust_level)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING
    """, (contributor_id, contributor_id, layer_type, trust))
    
    cur.execute("""
        INSERT INTO container_layers (container_id, id, name, type, contributor_id, trust_level)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (container_id, id) DO NOTHING
    """, (container_uuid, layer_id, name, layer_type, contributor_id, trust))

print("Created layers")

# Helper to create atoms
def create_atom(field_path, field_name, value, unit, source_type, contributor_id, trust_level, layer_id, citation=None):
    atom_id = str(uuid.uuid4())
    
    citation_doc = None
    citation_page = None
    citation_excerpt = None
    citation_confidence = None
    
    if citation:
        citation_doc = citation.get('document') or citation.get('source')
        if citation_doc and not citation_doc.startswith('0711:'):
            citation_doc = f"0711:document:bosch:{citation_doc}:v1"
        citation_page = citation.get('page')
        citation_excerpt = citation.get('quote') or citation.get('raw_value')
        citation_confidence = 0.95 if citation else None
    
    cur.execute("""
        INSERT INTO container_atoms (
            id, container_id, layer_id, field_path, field_name, value, value_type, unit,
            source_type, contributor_id, trust_level, commit_hash,
            citation_document, citation_page, citation_excerpt, citation_confidence
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        atom_id, container_uuid, layer_id, field_path, field_name,
        Json(value), type(value).__name__, unit,
        source_type, contributor_id, trust_level, 'import-test-001',
        citation_doc, citation_page, citation_excerpt, citation_confidence
    ))

# Import abmessungen (manufacturer layer)
abmessungen = container['atoms']['abmessungen']
for key in ['breite', 'tiefe', 'hoehe', 'gewicht']:
    if key in abmessungen and key != '_meta':
        atom = abmessungen[key]
        create_atom(
            f"abmessungen.{key}",
            key.replace('oe', 'ö').capitalize(),
            atom['value'],
            atom.get('unit'),
            'manufacturer',
            'bosch-thermotechnik',
            'highest',
            '000-manufacturer',
            atom.get('citation')
        )

print("Created abmessungen atoms")

# Import effizienz (manufacturer layer)
effizienz = container['atoms']['effizienz']
for key, atom in effizienz.items():
    if key != '_meta' and isinstance(atom, dict) and 'value' in atom:
        create_atom(
            f"effizienz.{key}",
            atom.get('ef_code', key),
            atom['value'],
            atom.get('unit'),
            'manufacturer',
            'bosch-thermotechnik',
            'highest',
            '000-manufacturer',
            atom.get('citation')
        )

print("Created effizienz atoms")

# Import leistung (manufacturer layer)
leistung = container['atoms']['leistung']
for key, atom in leistung.items():
    if key != '_meta' and isinstance(atom, dict) and 'value' in atom:
        create_atom(
            f"leistung.{key}",
            atom.get('name', key),
            atom['value'],
            atom.get('unit'),
            'manufacturer',
            'bosch-thermotechnik',
            'highest',
            '000-manufacturer',
            atom.get('citation')
        )

print("Created leistung atoms")

# Import ETIM features (datasheet layer)
etim_features = container['atoms']['etim_features']
for ef_code, feature in etim_features.items():
    if ef_code.startswith('_'):
        continue
    if isinstance(feature, dict) and 'value' in feature:
        # Use corrected value if there's a conflict
        value = feature['value']
        status = feature.get('audit_status', 'unknown')
        
        create_atom(
            f"etim.{ef_code}",
            feature.get('name', ef_code),
            value,
            feature.get('unit'),
            'extraction',
            '0711-audit-pipeline',
            'medium',
            '002-datasheet',
            feature.get('citation')
        )

print("Created ETIM feature atoms")

# Update layer counts
cur.execute("""
    UPDATE container_layers cl SET atom_count = (
        SELECT COUNT(*) FROM container_atoms ca 
        WHERE ca.container_id = cl.container_id AND ca.layer_id = cl.id
    )
    WHERE cl.container_id = %s
""", (container_uuid,))

conn.commit()

# Verify
cur.execute("SELECT COUNT(*) FROM container_atoms WHERE container_id = %s", (container_uuid,))
atom_count = cur.fetchone()[0]

cur.execute("""
    SELECT cl.name, cl.atom_count 
    FROM container_layers cl 
    WHERE cl.container_id = %s
    ORDER BY cl.id
""", (container_uuid,))
layers_info = cur.fetchall()

print(f"\n✓ Import complete!")
print(f"  Container: {container_id_str}")
print(f"  Total atoms: {atom_count}")
print(f"  Layers:")
for name, count in layers_info:
    print(f"    - {name}: {count} atoms")

cur.close()
conn.close()
