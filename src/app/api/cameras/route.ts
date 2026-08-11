import { NextResponse } from "next/server";
import { caltransAdapter } from "@/lib/adapters/caltrans";
import { driveTexasAdapter } from "@/lib/adapters/drivetexas";
import { ksatAdapter } from "@/lib/adapters/ksat";
import { sanMarcosAdapter } from "@/lib/adapters/sanmarcos";
import { sanAntonioPublicAdapter } from "@/lib/adapters/sanantonio-public";

export const revalidate = 300;
export async function GET() {
  try {
    const adapters = [caltransAdapter, driveTexasAdapter, ksatAdapter, sanMarcosAdapter, sanAntonioPublicAdapter];
    const results = await Promise.allSettled(adapters.map((adapter) => adapter.fetch()));
    const cameras = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    const sources = adapters.map((adapter, index) => ({
      id: adapter.id,
      count: results[index].status === "fulfilled" ? results[index].value.length : 0,
      error: results[index].status === "rejected" ? String(results[index].reason) : null,
    }));
    if (!cameras.length) throw new Error("All official camera sources are unavailable");
    return NextResponse.json({ cameras, sources, generatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ cameras: [], error: error instanceof Error ? error.message : "Source unavailable" }, { status: 502 });
  }
}
