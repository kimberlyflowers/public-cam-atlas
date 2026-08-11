import { NextResponse } from "next/server";
import { caltransAdapter } from "@/lib/adapters/caltrans";

export const revalidate = 300;
export async function GET() {
  try {
    const cameras = await caltransAdapter.fetch();
    return NextResponse.json({ cameras, source: caltransAdapter.id, generatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ cameras: [], error: error instanceof Error ? error.message : "Source unavailable" }, { status: 502 });
  }
}
