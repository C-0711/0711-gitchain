import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";
import crypto from "crypto";

/**
 * GET /api/organizations/:slug/domains
 * List verified and pending domains for an organization
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;

    // Check if user is admin of org
    const org = await pool.query(
      `SELECT o.id, o.verified_domains
       FROM organizations o
       JOIN organization_members om ON o.id = om.org_id
       WHERE o.slug = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin') AND o.deleted_at IS NULL`,
      [slug, userId]
    );

    if (org.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    const orgData = org.rows[0];

    // Get domain verifications
    const domains = await pool.query(
      `SELECT
         id,
         domain,
         verification_method,
         verification_token,
         verified,
         verified_at,
         last_check_at,
         check_count,
         created_at
       FROM domain_verifications
       WHERE org_id = $1
       ORDER BY verified DESC, created_at DESC`,
      [orgData.id]
    );

    return NextResponse.json({
      domains: domains.rows.map((d) => ({
        id: d.id,
        domain: d.domain,
        verificationMethod: d.verification_method,
        verificationToken: d.verification_token,
        verified: d.verified,
        verifiedAt: d.verified_at,
        lastCheckAt: d.last_check_at,
        checkCount: d.check_count,
        createdAt: d.created_at,
        instructions: getVerificationInstructions(d.verification_method, d.domain, d.verification_token),
      })),
    });
  } catch (error) {
    console.error("Error fetching domains:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getVerificationInstructions(method: string, domain: string, token: string): string {
  switch (method) {
    case "dns_txt":
      return `Add a TXT record to ${domain} with value: gitchain-verification=${token}`;
    case "dns_cname":
      return `Add a CNAME record: _gitchain.${domain} -> verify.gitchain.io`;
    case "meta_tag":
      return `Add to your homepage: <meta name="gitchain-verification" content="${token}">`;
    default:
      return "Unknown verification method";
  }
}

/**
 * POST /api/organizations/:slug/domains
 * Add a domain for verification
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    const body = await req.json();
    const { domain, verificationMethod } = body;

    // Validate domain
    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    const domainLower = domain.toLowerCase().trim();
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
    if (!domainRegex.test(domainLower)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    const method = verificationMethod || "dns_txt";
    if (!["dns_txt", "dns_cname", "meta_tag"].includes(method)) {
      return NextResponse.json(
        { error: "Invalid verification method. Use: dns_txt, dns_cname, or meta_tag" },
        { status: 400 }
      );
    }

    // Check if user is admin of org
    const org = await pool.query(
      `SELECT o.id
       FROM organizations o
       JOIN organization_members om ON o.id = om.org_id
       WHERE o.slug = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin') AND o.deleted_at IS NULL`,
      [slug, userId]
    );

    if (org.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    const orgId = org.rows[0].id;

    // Check if domain already exists for this org
    const existing = await pool.query(
      `SELECT id, verified FROM domain_verifications WHERE org_id = $1 AND domain = $2`,
      [orgId, domainLower]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].verified) {
        return NextResponse.json(
          { error: "Domain is already verified" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Domain verification already pending" },
        { status: 409 }
      );
    }

    // Check if domain is claimed by another org
    const claimed = await pool.query(
      `SELECT o.slug FROM domain_verifications dv
       JOIN organizations o ON dv.org_id = o.id
       WHERE dv.domain = $1 AND dv.verified = TRUE`,
      [domainLower]
    );

    if (claimed.rows.length > 0) {
      return NextResponse.json(
        { error: `Domain is already claimed by organization: ${claimed.rows[0].slug}` },
        { status: 409 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");

    // Create verification record
    const result = await pool.query(
      `INSERT INTO domain_verifications (org_id, domain, verification_method, verification_token)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [orgId, domainLower, method, token]
    );

    // Log audit event
    await pool.query(
      `INSERT INTO organization_audit_log (org_id, actor_id, action, target_type, new_value)
       VALUES ($1, $2, 'domain.verification_started', 'domain', $3)`,
      [orgId, userId, JSON.stringify({ domain: domainLower, method })]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      domain: domainLower,
      verificationMethod: method,
      verificationToken: token,
      instructions: getVerificationInstructions(method, domainLower, token),
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error("Error adding domain:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
