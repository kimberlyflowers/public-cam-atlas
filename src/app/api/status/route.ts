import { NextRequest, NextResponse } from "next/server";
const ALLOWED = new Set(["cwwp2.dot.ca.gov", "wzmedia.dot.ca.gov", "pubads.g.doubleclick.net", "usgs-nims-images.s3.amazonaws.com", "api.algotraffic.com", "cdn3.wowza.com"]);
const isAllowed = (url: URL) => ALLOWED.has(url.hostname) || /^s\d+\.us-east-1\.skyvdn\.com$/.test(url.hostname);
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ status: "unknown" }, { status: 400 });
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !isAllowed(url)) return NextResponse.json({ status: "blocked" }, { status: 403 });
    const started = Date.now();
    let response = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(6000) });
    // Several public HLS CDNs reject or inconsistently route HEAD even while
    // the playlist GET is healthy. Confirm any failed HEAD with the same small
    // GET the browser player uses before marking a feed offline.
    if (!response.ok) {
      response = await fetch(url, { headers: { Range: "bytes=0-1023" }, cache: "no-store", signal: AbortSignal.timeout(6000) });
      await response.body?.cancel();
    }
    return NextResponse.json({ status: response.ok ? "online" : "offline", httpStatus: response.status, latencyMs: Date.now() - started, checkedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ status: "offline", checkedAt: new Date().toISOString() }); }
}
