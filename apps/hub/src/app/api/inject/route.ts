/**
 * Hub API proxy for inject
 */

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3100";

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const response = await fetch(`${API_URL}/api/inject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
