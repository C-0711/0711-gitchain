import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/organizations/:slug/sso
 * Get SSO configuration for an organization
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
      `SELECT o.id, o.sso_provider, o.require_2fa, o.plan
       FROM organizations o
       JOIN organization_members om ON o.id = om.org_id
       WHERE o.slug = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin') AND o.deleted_at IS NULL`,
      [slug, userId]
    );

    if (org.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    const orgData = org.rows[0];

    // Get identity providers
    const idps = await pool.query(
      `SELECT
         id,
         provider_type,
         name,
         slug,
         enabled,
         verified,
         verified_at,
         saml_entity_id,
         saml_sso_url,
         oidc_issuer,
         attribute_mapping,
         group_mapping,
         default_role,
         jit_provisioning,
         auto_update_profile,
         created_at,
         updated_at
       FROM sso_identity_providers
       WHERE org_id = $1
       ORDER BY created_at DESC`,
      [orgData.id]
    );

    return NextResponse.json({
      orgId: orgData.id,
      currentProvider: orgData.sso_provider,
      require2fa: orgData.require_2fa,
      plan: orgData.plan,
      identityProviders: idps.rows.map((idp) => ({
        id: idp.id,
        providerType: idp.provider_type,
        name: idp.name,
        slug: idp.slug,
        enabled: idp.enabled,
        verified: idp.verified,
        verifiedAt: idp.verified_at,
        samlEntityId: idp.saml_entity_id,
        samlSsoUrl: idp.saml_sso_url,
        oidcIssuer: idp.oidc_issuer,
        attributeMapping: idp.attribute_mapping,
        groupMapping: idp.group_mapping,
        defaultRole: idp.default_role,
        jitProvisioning: idp.jit_provisioning,
        autoUpdateProfile: idp.auto_update_profile,
        createdAt: idp.created_at,
        updatedAt: idp.updated_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching SSO config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/organizations/:slug/sso
 * Create a new identity provider
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

    // Check if user is admin of org with enterprise plan
    const org = await pool.query(
      `SELECT o.id, o.plan
       FROM organizations o
       JOIN organization_members om ON o.id = om.org_id
       WHERE o.slug = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin') AND o.deleted_at IS NULL`,
      [slug, userId]
    );

    if (org.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    const orgData = org.rows[0];

    if (orgData.plan !== "enterprise") {
      return NextResponse.json(
        { error: "SSO is only available on Enterprise plans" },
        { status: 403 }
      );
    }

    const {
      providerType,
      name,
      idpSlug,
      // SAML config
      samlEntityId,
      samlSsoUrl,
      samlSloUrl,
      samlCertificate,
      // OIDC config
      oidcIssuer,
      oidcClientId,
      oidcClientSecret,
      oidcScopes,
      // Mapping
      attributeMapping,
      groupMapping,
      defaultRole,
      jitProvisioning,
      autoUpdateProfile,
    } = body;

    // Validate required fields
    if (!providerType || !["saml", "oidc"].includes(providerType)) {
      return NextResponse.json(
        { error: "providerType must be 'saml' or 'oidc'" },
        { status: 400 }
      );
    }

    if (!name || !idpSlug) {
      return NextResponse.json(
        { error: "name and idpSlug are required" },
        { status: 400 }
      );
    }

    // Validate provider-specific fields
    if (providerType === "saml") {
      if (!samlEntityId || !samlSsoUrl || !samlCertificate) {
        return NextResponse.json(
          { error: "SAML requires entityId, ssoUrl, and certificate" },
          { status: 400 }
        );
      }
    }

    if (providerType === "oidc") {
      if (!oidcIssuer || !oidcClientId || !oidcClientSecret) {
        return NextResponse.json(
          { error: "OIDC requires issuer, clientId, and clientSecret" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate slug
    const existing = await pool.query(
      `SELECT id FROM sso_identity_providers WHERE org_id = $1 AND slug = $2`,
      [orgData.id, idpSlug]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An identity provider with this slug already exists" },
        { status: 409 }
      );
    }

    // Create identity provider
    const result = await pool.query(
      `INSERT INTO sso_identity_providers (
         org_id,
         provider_type,
         name,
         slug,
         saml_entity_id,
         saml_sso_url,
         saml_slo_url,
         saml_certificate,
         oidc_issuer,
         oidc_client_id,
         oidc_client_secret_encrypted,
         oidc_scopes,
         attribute_mapping,
         group_mapping,
         default_role,
         jit_provisioning,
         auto_update_profile,
         created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id, created_at`,
      [
        orgData.id,
        providerType,
        name,
        idpSlug,
        samlEntityId || null,
        samlSsoUrl || null,
        samlSloUrl || null,
        samlCertificate || null,
        oidcIssuer || null,
        oidcClientId || null,
        oidcClientSecret || null,  // TODO: Encrypt
        oidcScopes || null,
        attributeMapping ? JSON.stringify(attributeMapping) : '{}',
        groupMapping ? JSON.stringify(groupMapping) : '{}',
        defaultRole || "member",
        jitProvisioning !== false,
        autoUpdateProfile !== false,
        userId,
      ]
    );

    // Log audit event
    await pool.query(
      `INSERT INTO organization_audit_log (org_id, actor_id, action, target_type, target_id, new_value)
       VALUES ($1, $2, 'sso.provider_created', 'sso_provider', $3, $4)`,
      [orgData.id, userId, result.rows[0].id, JSON.stringify({ name, providerType })]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      name,
      slug: idpSlug,
      providerType,
      enabled: false,
      verified: false,
      createdAt: result.rows[0].created_at,
      message: "Identity provider created. Test and verify before enabling.",
    });
  } catch (error) {
    console.error("Error creating SSO provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
