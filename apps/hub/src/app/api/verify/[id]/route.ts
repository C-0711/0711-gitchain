/**
 * Hub API proxy for verify
 */

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3100";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const response = await fetch(
    `${API_URL}/api/verify/${encodeURIComponent(params.id)}`
  );
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
