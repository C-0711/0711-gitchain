/**
 * Bosch Migration Script
 * 
 * Exports Bosch products from PostgreSQL to GitChain containers.
 * Run after platform is ready.
 */

import { Pool } from "pg";
import { GitRepository } from "@0711/git";
import { createBatch } from "@0711/chain";

const BATCH_SIZE = 100;

const gitConfig = {
  baseDir: process.env.GITCHAIN_DATA_DIR || "/data/gitchain/repos",
  authorName: "Bosch Migration",
  authorEmail: "migration@gitchain.0711.io",
};

async function main() {
  console.log("🚀 Starting Bosch migration...");

  // Connect to Bosch database
  const pool = new Pool({
    host: process.env.BOSCH_DB_HOST || "localhost",
    port: parseInt(process.env.BOSCH_DB_PORT || "5432"),
    database: "bosch_products",
    user: process.env.BOSCH_DB_USER || "bosch_user",
    password: process.env.BOSCH_DB_PASSWORD,
  });

  // Get product count
  const countResult = await pool.query("SELECT COUNT(*) FROM products");
  const total = parseInt(countResult.rows[0].count);
  console.log("Total products:", total.toLocaleString());

  // Initialize Git repository
  const repo = new GitRepository("product/bosch", gitConfig);
  await repo.init();

  let processed = 0;
  let offset = 0;

  while (offset < total) {
    // Fetch batch
    const result = await pool.query(
      `SELECT 
        p.supplier_pid,
        p.short_description,
        p.description_long,
        p.etim_class_id,
        p.etim_class_version,
        array_agg(DISTINCT jsonb_build_object(
          code, f.feature_code,
          name, f.feature_name,
          value, f.value,
          unit, f.unit
        )) as features
      FROM products p
      LEFT JOIN technical_specifications f ON p.supplier_pid = f.supplier_pid
      GROUP BY p.supplier_pid, p.short_description, p.description_long, 
               p.etim_class_id, p.etim_class_version
      ORDER BY p.supplier_pid
      LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset]
    );

    const containers = [];

    for (const row of result.rows) {
      const container = {
        meta: {
          name: row.short_description || row.supplier_pid,
          description: row.description_long,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: "bosch-migration",
        },
        data: {
          supplierPid: row.supplier_pid,
          etimClass: row.etim_class_id,
          etimVersion: row.etim_class_version,
          features: row.features?.filter((f: any) => f.code) || [],
        },
      };

      // Write to Git
      await repo.writeContainer(row.supplier_pid, container);
      containers.push({ id: row.supplier_pid, data: container.data });
      processed++;
    }

    // Create batch for blockchain
    const batch = createBatch(
      containers.map((c) => ({
        id: `0711:product:bosch:${c.id}`,
        data: c.data,
      })),
      `ipfs://bosch-batch-${Math.floor(offset / BATCH_SIZE)}`
    );

    console.log(
      `Processed ${processed}/${total} (${((processed / total) * 100).toFixed(1)}%) ` +
      `| Batch merkle root: ${batch.merkleRoot.slice(0, 16)}...`
    );

    offset += BATCH_SIZE;
  }

  await pool.end();
  console.log("\n✅ Migration complete!");
  console.log("Total containers:", processed.toLocaleString());
}

main().catch(console.error);
