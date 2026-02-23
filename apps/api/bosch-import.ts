/**
 * Bosch Product Import Script v2
 * 
 * Imports 23,141 products from Bosch PostgreSQL to GitChain.
 */

import { Pool } from "pg";
import crypto from "crypto";

// ===========================================
// CONFIG
// ===========================================

const BOSCH_DB = "postgresql://bosch_user:bosch_secure_2024@localhost:5434/bosch_products";
const GITCHAIN_DB = "postgresql://gitchain:gitchain2026@localhost:5440/gitchain";

const BATCH_SIZE = 500;
const NAMESPACE = "bosch";

// ===========================================
// CONNECTIONS
// ===========================================

const boschPool = new Pool({ connectionString: BOSCH_DB });
const gitchainPool = new Pool({ connectionString: GITCHAIN_DB });

// ===========================================
// HELPERS
// ===========================================

function generateContentHash(data: Record<string, unknown>): string {
  const json = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(json).digest("hex");
}

function buildContainerId(identifier: string, version: number): string {
  return `0711:product:${NAMESPACE}:${identifier}:v${version}`;
}

// ===========================================
// MAIN IMPORT
// ===========================================

async function importProducts() {
  console.log("🚀 Starting Bosch Product Import v2...\n");

  // Get namespace ID
  const nsResult = await gitchainPool.query(
    "SELECT id FROM namespaces WHERE name = $1",
    [NAMESPACE]
  );
  const namespaceId = nsResult.rows[0]?.id;
  
  if (!namespaceId) {
    throw new Error("Bosch namespace not found!");
  }
  console.log(`✅ Found namespace: ${namespaceId}\n`);

  // Get system user ID
  const userResult = await gitchainPool.query(
    "SELECT id FROM users WHERE username = 'system'"
  );
  const systemUserId = userResult.rows[0]?.id;
  console.log(`✅ System user: ${systemUserId}\n`);

  // Count total products
  const countResult = await boschPool.query("SELECT COUNT(*) FROM products");
  const totalProducts = parseInt(countResult.rows[0].count, 10);
  console.log(`📦 Total products to import: ${totalProducts}\n`);

  // Get existing containers to avoid duplicates
  const existingResult = await gitchainPool.query(
    "SELECT identifier FROM containers WHERE namespace = $1 AND deleted_at IS NULL",
    [NAMESPACE]
  );
  const existingIds = new Set(existingResult.rows.map(r => r.identifier));
  console.log(`📋 Already imported: ${existingIds.size}\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let offset = 0;

  while (offset < totalProducts) {
    // Fetch batch of products with correct columns
    const products = await boschPool.query(`
      SELECT 
        p.supplier_pid,
        p.description_short,
        p.description_long,
        p.manufacturer_name,
        p.manufacturer_pid,
        p.gtin,
        p.ean,
        p.product_type,
        p.product_group,
        p.price,
        p.article_type,
        p.waregroup,
        p.keyword,
        p.discontinued,
        p.created_at,
        p.updated_at
      FROM products p
      WHERE p.discontinued = false OR p.discontinued IS NULL
      ORDER BY p.supplier_pid
      LIMIT $1 OFFSET $2
    `, [BATCH_SIZE, offset]);

    // Process each product
    for (const product of products.rows) {
      const identifier = product.supplier_pid;

      // Skip if already exists
      if (existingIds.has(identifier)) {
        skipped++;
        continue;
      }

      try {
        // Build container data
        const data: Record<string, unknown> = {
          name: product.description_short || identifier,
          supplier_pid: product.supplier_pid,
          description_short: product.description_short,
          description_long: product.description_long,
          manufacturer: {
            name: product.manufacturer_name || "Bosch",
            pid: product.manufacturer_pid,
          },
          gtin: product.gtin,
          ean: product.ean,
          product_type: product.product_type,
          product_group: product.product_group,
          article_type: product.article_type,
          waregroup: product.waregroup,
          keywords: product.keyword ? product.keyword.split(/[,;]/).map((k: string) => k.trim()).filter(Boolean) : [],
        };

        // Add price if available
        if (product.price) {
          data.price = {
            amount: parseFloat(product.price),
            currency: "EUR",
          };
        }

        // Clean up null/undefined values
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (value === null || value === undefined || value === "") {
            delete data[key];
          }
          if (Array.isArray(value) && value.length === 0) {
            delete data[key];
          }
          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            const obj = value as Record<string, unknown>;
            Object.keys(obj).forEach(k => {
              if (obj[k] === null || obj[k] === undefined) {
                delete obj[k];
              }
            });
            if (Object.keys(obj).length === 0) {
              delete data[key];
            }
          }
        });

        const containerId = buildContainerId(identifier, 1);
        const contentHash = generateContentHash(data);

        // Insert container
        await gitchainPool.query(`
          INSERT INTO containers (
            container_id, type, namespace_id, namespace, identifier, version,
            data, meta, content_hash, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          containerId,
          "product",
          namespaceId,
          NAMESPACE,
          identifier,
          1,
          JSON.stringify(data),
          JSON.stringify({ 
            source: "bosch-pim", 
            imported_at: new Date().toISOString(),
            original_created: product.created_at,
            original_updated: product.updated_at,
          }),
          contentHash,
          systemUserId,
          systemUserId,
        ]);

        imported++;
        existingIds.add(identifier);

      } catch (err: any) {
        errors++;
        if (errors <= 5) {
          console.error(`\n❌ Error importing ${identifier}: ${err.message}`);
        }
      }
    }

    offset += BATCH_SIZE;
    const progress = Math.min(100, Math.round((offset / totalProducts) * 100));
    process.stdout.write(`\r⏳ Progress: ${progress}% | Imported: ${imported} | Skipped: ${skipped} | Errors: ${errors}   `);
  }

  console.log("\n\n✅ Import complete!");
  console.log(`   📦 Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  // Update namespace container count
  await gitchainPool.query(
    "UPDATE namespaces SET container_count = (SELECT COUNT(*) FROM containers WHERE namespace = $1 AND deleted_at IS NULL) WHERE name = $1",
    [NAMESPACE]
  );

  const finalCount = await gitchainPool.query(
    "SELECT container_count FROM namespaces WHERE name = $1",
    [NAMESPACE]
  );
  console.log(`\n📊 Total containers in bosch namespace: ${finalCount.rows[0]?.container_count}`);

  // Close connections
  await boschPool.end();
  await gitchainPool.end();
}

// Run
importProducts().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
