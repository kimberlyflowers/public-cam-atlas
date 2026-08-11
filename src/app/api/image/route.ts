import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set(["cwwp2.dot.ca.gov", "usgs-nims-images.s3.amazonaws.com", "api.algotraffic.com"]);
const fallback = () => new NextResponse(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#193029"/><path d="M292 151h56l17 22h29v75H246v-75h29z" fill="none" stroke="#688078" stroke-width="8"/><circle cx="320" cy="208" r="25" fill="none" stroke="#688078" stroke-width="8"/><text x="320" y="290" text-anchor="middle" fill="#8da098" font-family="Arial" font-size="16">FEED TEMPORARILY UNAVAILABLE</text></svg>`, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=30" } });
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  let url: URL;
  try { url = new URL(raw); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
  if (url.protocol !== "https:" || !ALLOWED.has(url.hostname)) return NextResponse.json({ error: "Source not allowed" }, { status: 403 });
  try {
    const upstream = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!upstream.ok || !upstream.body) return fallback();
    return new NextResponse(upstream.body, { headers: { "Content-Type": upstream.headers.get("content-type") || "image/jpeg", "Cache-Control": "public, max-age=5, s-maxage=10" } });
  } catch { return fallback(); }
}
