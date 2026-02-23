const { Pool } = require('pg');
const fs = require('fs');

// GitChain DB
const gitchainPool = new Pool({
  host: 'localhost',
  port: 5440,
  database: 'gitchain',
  user: 'gitchain',
  password: 'gitchain2026',
});

// Container ID
const CONTAINER_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const CONTAINER_ID = '0711:product:bosch:7736606982';
const COMMIT_HASH = 'real-import-' + Date.now().toString(36);

async function main() {
  console.log('🚀 Importing real Bosch data into GitChain...');
  
  // Read specs from CSV
  const csv = fs.readFileSync('/tmp/bosch_7736606982_specs.csv', 'utf-8');
  const lines = csv.trim().split('\n').filter(l => l.trim());
  
  console.log(`📊 Found ${lines.length} specifications`);
  
  // Parse and organize by category
  const specsByCategory = {};
  
  for (const line of lines) {
    const [parameter_de, value, unit, pdf_file, category] = line.split('|');
    const cat = category || 'general';
    
    if (!specsByCategory[cat]) {
      specsByCategory[cat] = [];
    }
    
    specsByCategory[cat].push({
      parameter: parameter_de,
      value: value,
      unit: unit || null,
      source_document: pdf_file || null,
    });
  }
  
  console.log(`📁 Categories: ${Object.keys(specsByCategory).join(', ')}`);
  
  const client = await gitchainPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing atoms for this container
    await client.query('DELETE FROM container_atoms WHERE container_id = $1', [CONTAINER_UUID]);
    console.log('🧹 Cleared existing atoms');
    
    // Ensure layers exist
    const layers = [
      { id: '000-core', name: 'Bosch Original', type: 'manufacturer', contributor: 'bosch', trust: 'highest' },
      { id: '001-etim', name: 'ETIM Klassifikation', type: 'classification', contributor: 'etim-international', trust: 'high' },
      { id: '002-datasheet', name: 'Datenblatt-Extraktion', type: 'ai_generated', contributor: 'bombas@0711.io', trust: 'medium' },
    ];
    
    for (const layer of layers) {
      await client.query(`
        INSERT INTO container_layers (id, container_id, name, type, contributor_id, trust_level, commit_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (container_id, id) DO UPDATE SET updated_at = NOW()
      `, [layer.id, CONTAINER_UUID, layer.name, layer.type, layer.contributor, layer.trust, COMMIT_HASH]);
    }
    console.log('📂 Layers created/updated');
    
    let atomCount = 0;
    
    // Insert atoms for each category
    for (const [category, specs] of Object.entries(specsByCategory)) {
      const layerId = category.startsWith('EF') ? '001-etim' : '002-datasheet';
      const sourceType = category.startsWith('EF') ? 'classification' : 'ai_generated';
      const contributorId = category.startsWith('EF') ? 'etim-international' : 'bombas@0711.io';
      const trustLevel = category.startsWith('EF') ? 'high' : 'medium';
      
      for (const spec of specs) {
        const fieldPath = `${category}.${spec.parameter.toLowerCase().replace(/[^a-z0-9äöüß]/gi, '_')}`;
        
        await client.query(`
          INSERT INTO container_atoms (
            container_id, layer_id, field_path, field_name,
            value, value_type, unit,
            source_type, contributor_id, trust_level, commit_hash,
            citation_document, citation_confidence
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          CONTAINER_UUID,
          layerId,
          fieldPath,
          spec.parameter,
          JSON.stringify(spec.value),
          typeof spec.value === 'number' ? 'number' : 'string',
          spec.unit,
          sourceType,
          contributorId,
          trustLevel,
          COMMIT_HASH,
          spec.source_document ? `0711:document:bosch:${spec.source_document}:v1` : null,
          spec.source_document ? 0.95 : null,
        ]);
        
        atomCount++;
      }
    }
    
    // Add ETIM class info
    await client.query(`
      INSERT INTO container_atoms (container_id, layer_id, field_path, field_name, value, value_type, source_type, contributor_id, trust_level, commit_hash)
      VALUES 
        ($1, '001-etim', 'etim.class_code', 'ETIM Klasse', '"EC012034"', 'string', 'classification', 'etim-international', 'high', $2),
        ($1, '001-etim', 'etim.class_name', 'ETIM Klassenname', '"Luft/Wasser-Wärmepumpe"', 'string', 'classification', 'etim-international', 'high', $2),
        ($1, '001-etim', 'etim.version', 'ETIM Version', '"9.0"', 'string', 'classification', 'etim-international', 'high', $2)
      ON CONFLICT DO NOTHING
    `, [CONTAINER_UUID, COMMIT_HASH]);
    atomCount += 3;
    
    // Update container version
    await client.query(`
      UPDATE containers SET version = version + 1, updated_at = NOW() WHERE id = $1
    `, [CONTAINER_UUID]);
    
    // Add commit record
    await client.query(`
      INSERT INTO container_commits (container_id, version, commit_hash, author_id, message, created_at)
      SELECT id, version, $2, 'bombas@0711.io', 'Real Bosch data import: 369 specifications from datasheets', NOW()
      FROM containers WHERE id = $1
    `, [CONTAINER_UUID, COMMIT_HASH]);
    
    await client.query('COMMIT');
    
    console.log(`✅ Imported ${atomCount} atoms`);
    console.log(`📦 Container: ${CONTAINER_ID}`);
    console.log(`🔖 Commit: ${COMMIT_HASH}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await gitchainPool.end();
  }
}

main().catch(console.error);
