/**
 * Example: Batch upload containers to GitChain
 * 
 * This example shows how to upload multiple containers
 * in a single blockchain-anchored batch.
 */

import { GitChainClient } from "@0711/sdk";

const client = new GitChainClient({
  apiUrl: "https://api.gitchain.0711.io",
  apiKey: process.env.GITCHAIN_API_KEY,
});

async function main() {
  // Products to upload
  const products = [
    {
      identifier: "PRODUCT-001",
      name: "Widget A",
      data: {
        sku: "WGT-A-001",
        price: 99.99,
        specs: {
          width: 100,
          height: 50,
          weight: 0.5,
        },
      },
    },
    {
      identifier: "PRODUCT-002",
      name: "Widget B",
      data: {
        sku: "WGT-B-002",
        price: 149.99,
        specs: {
          width: 150,
          height: 75,
          weight: 0.8,
        },
      },
    },
  ];

  // Upload as batch
  const result = await client.batchCreate(
    products.map((p) => ({
      type: "product",
      namespace: "mycompany",
      identifier: p.identifier,
      data: p.data,
      meta: { name: p.name },
    }))
  );

  console.log("Batch created!");
  console.log("Merkle root:", result.batch.merkleRoot);
  
  if (result.batch.batchId) {
    console.log("Batch ID:", result.batch.batchId);
    console.log("Anchored to blockchain!");
  }

  console.log("\nContainers:");
  for (const container of result.containers) {
    console.log(`  - ${container.id}`);
  }
}

main().catch(console.error);
