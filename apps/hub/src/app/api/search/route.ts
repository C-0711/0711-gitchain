import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3100";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const response = await fetch(`${API_URL}/api/search?${searchParams}`);
  return NextResponse.json(await response.json());
}
