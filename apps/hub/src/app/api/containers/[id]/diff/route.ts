import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const containerId = decodeURIComponent(params.id);
  const { searchParams } = new URL(request.url);
  const fromLayer = searchParams.get("from");
  const toLayer = searchParams.get("to");

  if (!fromLayer || !toLayer) {
    return NextResponse.json({ 
      error: "Missing 'from' and 'to' layer parameters" 
    }, { status: 400 });
  }

  try {
    const fromAtomsResult = await pool.query(
      "SELECT ca.field_path, ca.field_name, ca.value, ca.unit, ca.trust_level, ca.source_type FROM container_atoms ca JOIN containers c ON ca.container_id = c.id WHERE c.container_id = $1 AND ca.layer_id = $2 AND ca.is_current = true ORDER BY ca.field_path",
      [containerId, fromLayer]
    );

    const toAtomsResult = await pool.query(
      "SELECT ca.field_path, ca.field_name, ca.value, ca.unit, ca.trust_level, ca.source_type FROM container_atoms ca JOIN containers c ON ca.container_id = c.id WHERE c.container_id = $1 AND ca.layer_id = $2 AND ca.is_current = true ORDER BY ca.field_path",
      [containerId, toLayer]
    );

    const fromAtoms: Record<string, any> = {};
    const toAtoms: Record<string, any> = {};

    fromAtomsResult.rows.forEach(row => {
      fromAtoms[row.field_path] = row;
    });

    toAtomsResult.rows.forEach(row => {
      toAtoms[row.field_path] = row;
    });

    const allFields = new Set([...Object.keys(fromAtoms), ...Object.keys(toAtoms)]);
    
    const additions: any[] = [];
    const deletions: any[] = [];
    const modifications: any[] = [];
    let unchanged = 0;

    allFields.forEach(field => {
      const from = fromAtoms[field];
      const to = toAtoms[field];

      if (!from && to) {
        additions.push({
          field,
          name: to.field_name,
          value: to.value,
          unit: to.unit,
          trust: to.trust_level,
        });
      } else if (from && !to) {
        deletions.push({
          field,
          name: from.field_name,
          value: from.value,
          unit: from.unit,
          trust: from.trust_level,
        });
      } else if (from && to) {
        const fromValue = JSON.stringify(from.value);
        const toValue = JSON.stringify(to.value);
        
        if (fromValue !== toValue || from.unit !== to.unit) {
          modifications.push({
            field,
            name: to.field_name || from.field_name,
            from: { value: from.value, unit: from.unit, trust: from.trust_level },
            to: { value: to.value, unit: to.unit, trust: to.trust_level },
          });
        } else {
          unchanged++;
        }
      }
    });

    return NextResponse.json({
      from: fromLayer,
      to: toLayer,
      stats: {
        additions: additions.length,
        deletions: deletions.length,
        modifications: modifications.length,
        unchanged,
        total: allFields.size,
      },
      diff: {
        additions,
        deletions,
        modifications,
      },
    });
  } catch (error) {
    console.error("Error calculating diff:", error);
    return NextResponse.json({ error: "Failed to calculate diff" }, { status: 500 });
  }
}
