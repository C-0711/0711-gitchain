import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const response = await fetch(`${API_URL}/api/containers?${searchParams}`);
  return NextResponse.json(await response.json());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch(`${API_URL}/api/containers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
