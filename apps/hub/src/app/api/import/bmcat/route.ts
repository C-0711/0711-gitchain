import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken, withTransaction } from "@/lib/db";
import crypto from "crypto";

function generateContentHash(data: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}

// POST /api/import/bmcat - Import from BMEcat XML (pre-parsed JSON)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { org_id, namespace, products, catalog_info } = body;

    // BMEcat products are pre-parsed from XML to JSON
    // Expected structure per product:
    // {
    //   SUPPLIER_PID: "7739622385",
    //   DESCRIPTION_SHORT: "...",
    //   DESCRIPTION_LONG: "...",
    //   MANUFACTURER_NAME: "Bosch",
    //   MANUFACTURER_PID: "...",
    //   EAN: "...",
    //   PRODUCT_FEATURES: [{ ETIM_CLASS: "...", features: [...] }],
    //   MIME_INFO: [{ MIME_TYPE: "image/jpeg", MIME_SOURCE: "..." }],
    //   PRICE_INFO: [...]
    // }

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "products array is required" },
        { status: 400 }
      );
    }

    // Check org membership
    if (org_id) {
      const memberResult = await pool.query(
        "SELECT * FROM organization_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
        [org_id, userId]
      );

      if (memberResult.rows.length === 0) {
        return NextResponse.json(
          { error: "You are not a member of this organization" },
          { status: 403 }
        );
      }
    }

    // Create import job
    const jobResult = await pool.query(
      `INSERT INTO import_jobs (org_id, user_id, type, total_items, status, started_at)
       VALUES ($1, $2, 'bmcat', $3, 'processing', NOW())
       RETURNING *`,
      [org_id || null, userId, products.length]
    );

    const job = jobResult.rows[0];

    // Extract catalog namespace from catalog_info or use default
    const catalogNamespace =
      namespace ||
      catalog_info?.CATALOG_ID?.toLowerCase() ||
      catalog_info?.SUPPLIER_NAME?.toLowerCase().replace(/\s+/g, "-") ||
      "bmcat";

    // Process products
    const createdContainers: string[] = [];
    const errors: Array<{ sku: string; error: string }> = [];
    let processed = 0;

    await withTransaction(async (client) => {
      for (const product of products) {
        try {
          const sku = product.SUPPLIER_PID || product.supplier_pid;
          if (!sku) {
            errors.push({ sku: "unknown", error: "Missing SUPPLIER_PID" });
            continue;
          }

          // Build container data from BMEcat structure
          const containerData = {
            name:
              product.DESCRIPTION_SHORT ||
              product.description_short ||
              sku,
            description:
              product.DESCRIPTION_LONG || product.description_long || "",
            supplierPid: sku,
            manufacturerName:
              product.MANUFACTURER_NAME || product.manufacturer_name,
            manufacturerPid:
              product.MANUFACTURER_PID || product.manufacturer_pid,
            ean: product.EAN || product.ean,
            etimClass: extractEtimClass(product),
            features: extractFeatures(product),
            media: extractMedia(product),
            prices: extractPrices(product),
            // Keep original for reference
            _bmcat: product,
          };

          const containerId = `0711:product:${catalogNamespace}:${sku}`;
          const contentHash = generateContentHash(containerData);

          const containerResult = await client.query(
            `INSERT INTO containers (
               container_id, type, namespace, identifier, version,
               data, content_hash, created_by, org_id, visibility
             )
             VALUES ($1, 'product', $2, $3, 1, $4, $5, $6, $7, $8)
             ON CONFLICT (container_id) DO UPDATE SET
               data = $4,
               content_hash = $5,
               updated_by = $6,
               version = containers.version + 1,
               updated_at = NOW()
             RETURNING id`,
            [
              containerId,
              catalogNamespace,
              sku,
              JSON.stringify(containerData),
              contentHash,
              userId,
              org_id || null,
              org_id ? "org" : "private",
            ]
          );

          createdContainers.push(containerResult.rows[0].id);
          processed++;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push({
            sku: product.SUPPLIER_PID || "unknown",
            error: errorMessage,
          });
        }
      }
    });

    // Update job status
    await pool.query(
      `UPDATE import_jobs SET
         status = $1,
         processed_items = $2,
         failed_items = $3,
         created_containers = $4,
         errors = $5,
         completed_at = NOW()
       WHERE id = $6`,
      [
        errors.length === products.length ? "failed" : "completed",
        processed,
        errors.length,
        createdContainers,
        JSON.stringify(errors),
        job.id,
      ]
    );

    return NextResponse.json(
      {
        job_id: job.id,
        status: errors.length === products.length ? "failed" : "completed",
        total: products.length,
        processed,
        failed: errors.length,
        containers: createdContainers.length,
        namespace: catalogNamespace,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing BMEcat:", error);
    return NextResponse.json(
      { error: "Failed to import BMEcat" },
      { status: 500 }
    );
  }
}

// Helper to extract ETIM class from product
function extractEtimClass(
  product: Record<string, unknown>
): { code: string; name?: string } | null {
  const features = product.PRODUCT_FEATURES || product.product_features;
  if (!Array.isArray(features)) return null;

  for (const featureGroup of features) {
    if (
      featureGroup.ETIM_CLASS ||
      featureGroup.etim_class ||
      featureGroup.REFERENCE_FEATURE_SYSTEM_NAME === "ETIM"
    ) {
      return {
        code:
          featureGroup.ETIM_CLASS ||
          featureGroup.etim_class ||
          featureGroup.REFERENCE_FEATURE_GROUP_ID,
        name:
          featureGroup.ETIM_CLASS_NAME ||
          featureGroup.etim_class_name ||
          featureGroup.REFERENCE_FEATURE_GROUP_NAME,
      };
    }
  }
  return null;
}

// Helper to extract features
function extractFeatures(
  product: Record<string, unknown>
): Array<{ name: string; value: unknown; unit?: string }> {
  const featureGroups = product.PRODUCT_FEATURES || product.product_features;
  if (!Array.isArray(featureGroups)) return [];

  const features: Array<{ name: string; value: unknown; unit?: string }> = [];

  for (const group of featureGroups) {
    const groupFeatures = group.FEATURE || group.features || [];
    if (!Array.isArray(groupFeatures)) continue;

    for (const feature of groupFeatures) {
      features.push({
        name: feature.FNAME || feature.fname || feature.name,
        value: feature.FVALUE || feature.fvalue || feature.value,
        unit: feature.FUNIT || feature.funit || feature.unit,
      });
    }
  }

  return features;
}

// Helper to extract media
function extractMedia(
  product: Record<string, unknown>
): Array<{ type: string; source: string; purpose?: string }> {
  const mimeInfo = product.MIME_INFO || product.mime_info;
  if (!Array.isArray(mimeInfo)) return [];

  return mimeInfo.map((mime: Record<string, string>) => ({
    type: mime.MIME_TYPE || mime.mime_type || "unknown",
    source: mime.MIME_SOURCE || mime.mime_source || "",
    purpose: mime.MIME_PURPOSE || mime.mime_purpose,
  }));
}

// Helper to extract prices
function extractPrices(
  product: Record<string, unknown>
): Array<{ amount: number; currency: string; type?: string }> {
  const priceInfo = product.PRODUCT_PRICE_DETAILS || product.price_info;
  if (!Array.isArray(priceInfo)) return [];

  const prices: Array<{ amount: number; currency: string; type?: string }> = [];

  for (const priceDetail of priceInfo) {
    const priceList = priceDetail.PRODUCT_PRICE || priceDetail.prices || [];
    if (!Array.isArray(priceList)) continue;

    for (const price of priceList) {
      prices.push({
        amount: parseFloat(price.PRICE_AMOUNT || price.amount || 0),
        currency: price.PRICE_CURRENCY || price.currency || "EUR",
        type: price.PRICE_TYPE || price.type,
      });
    }
  }

  return prices;
}
