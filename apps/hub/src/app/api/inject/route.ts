/**
 * Hub API proxy for inject
 */

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3100";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const container = searchParams.get("container");
  const format = searchParams.get("format") || "markdown";
  
  if (!container) {
    return NextResponse.json({ error: "container parameter required" }, { status: 400 });
  }
  
  try {
    const response = await fetch(`${API_URL}/api/inject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ containers: [container], format }),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (e) {
    return NextResponse.json({ error: "Failed to connect to API", details: String(e) }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const response = await fetch(`${API_URL}/api/inject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (e) {
    return NextResponse.json({ error: "Failed to connect to API", details: String(e) }, { status: 502 });
  }
}
