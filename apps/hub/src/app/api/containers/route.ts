import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "";
  const sort = searchParams.get("sort") || "recent";
  const search = searchParams.get("q") || "";

  try {
    let query = `
      SELECT
        c.id,
        c.container_id,
        c.type,
        c.namespace,
        c.identifier,
        c.version,
        c.data,
        c.meta,
        c.is_verified,
        c.created_at,
        c.updated_at,
        pi.snr,
        pi.manufacturer,
        pi.etim_class_code,
        pi.etim_class_name,
        (SELECT COUNT(*)::int FROM container_atoms ca WHERE ca.container_id = c.id AND ca.is_current = true) as atom_count,
        (SELECT COUNT(DISTINCT split_part(ca.field_path, '.', 1)) FROM container_atoms ca WHERE ca.container_id = c.id AND ca.is_current = true) as category_count
      FROM containers c
      LEFT JOIN product_identity pi ON c.id = pi.container_id
      WHERE c.deleted_at IS NULL
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (type) {
      query += ` AND c.type = $${paramIdx++}`;
      params.push(type);
    }

    if (search) {
      query += ` AND (
        c.container_id ILIKE $${paramIdx} OR
        c.identifier ILIKE $${paramIdx} OR
        c.namespace ILIKE $${paramIdx} OR
        (c.data->>'name') ILIKE $${paramIdx}
      )`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    switch (sort) {
      case "name":
        query += ` ORDER BY c.data->>'name' ASC NULLS LAST, c.identifier ASC`;
        break;
      case "oldest":
        query += ` ORDER BY c.created_at ASC`;
        break;
      default:
        query += ` ORDER BY c.updated_at DESC`;
    }

    query += ` LIMIT 100`;

    const result = await pool.query(query, params);

    const containers = result.rows.map((row) => {
      const data = row.data || {};
      return {
        id: row.container_id,
        uuid: row.id,
        type: row.type,
        namespace: row.namespace,
        identifier: row.identifier,
        version: row.version,
        name: data.name || row.identifier,
        description: data.description || "",
        isVerified: row.is_verified,
        snr: row.snr,
        manufacturer: row.manufacturer,
        etim: row.etim_class_code
          ? { classCode: row.etim_class_code, className: row.etim_class_name }
          : null,
        stats: {
          atoms: row.atom_count || 0,
          categories: row.category_count || 0,
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    // Get aggregate stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*)::int as total_containers,
        COUNT(DISTINCT namespace)::int as total_namespaces,
        COUNT(*) FILTER (WHERE is_verified = true)::int as verified_count,
        (SELECT COUNT(*)::int FROM container_atoms WHERE is_current = true) as total_atoms
      FROM containers
      WHERE deleted_at IS NULL
    `);

    const stats = statsResult.rows[0] || {};

    return NextResponse.json({
      containers,
      total: result.rowCount,
      stats: {
        totalContainers: stats.total_containers || 0,
        totalNamespaces: stats.total_namespaces || 0,
        verifiedCount: stats.verified_count || 0,
        totalAtoms: stats.total_atoms || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching containers:", error);
    return NextResponse.json(
      { containers: [], total: 0, error: "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      namespace,
      identifier,
      name,
      description,
      data: extraData,
    } = body;

    const containerId = `0711:${type}:${namespace}:${identifier}`;

    const result = await pool.query(
      `
      INSERT INTO containers (container_id, type, namespace, identifier, version, data, meta)
      VALUES ($1, $2, $3, $4, 1, $5, '{}')
      RETURNING id, container_id, version, created_at
    `,
      [
        containerId,
        type,
        namespace,
        identifier,
        JSON.stringify({ name, description, ...extraData }),
      ]
    );

    return NextResponse.json(
      { id: result.rows[0].container_id, version: 1 },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating container:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Container already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create container" },
      { status: 500 }
    );
  }
}
