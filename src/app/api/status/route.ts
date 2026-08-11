import { NextRequest, NextResponse } from "next/server";
const ALLOWED = new Set(["cwwp2.dot.ca.gov", "wzmedia.dot.ca.gov"]);
const isAllowed = (url: URL) => ALLOWED.has(url.hostname) || /^s\d+\.us-east-1\.skyvdn\.com$/.test(url.hostname);
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ status: "unknown" }, { status: 400 });
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !isAllowed(url)) return NextResponse.json({ status: "blocked" }, { status: 403 });
    const started = Date.now();
    const response = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(6000) });
    return NextResponse.json({ status: response.ok ? "online" : "offline", httpStatus: response.status, latencyMs: Date.now() - started, checkedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ status: "offline", checkedAt: new Date().toISOString() }); }
}
