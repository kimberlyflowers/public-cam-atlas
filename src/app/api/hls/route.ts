import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set(["wzmedia.dot.ca.gov"]);

function relay(target: string, base: URL) {
  const absolute = new URL(target, base).toString();
  return `/api/hls?url=${encodeURIComponent(absolute)}`;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  let url: URL;
  try { url = new URL(raw); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
  if (url.protocol !== "https:" || !ALLOWED.has(url.hostname)) return NextResponse.json({ error: "Source not allowed" }, { status: 403 });
  try {
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range) headers.set("range", range);
    const upstream = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) return NextResponse.json({ error: `Source returned ${upstream.status}` }, { status: upstream.status });
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    if (url.pathname.endsWith(".m3u8") || contentType.includes("mpegurl")) {
      const manifest = (await upstream.text())
        .replace(/URI="([^"]+)"/g, (_match, target: string) => `URI="${relay(target, url)}"`)
        .split("\n").map((line) => line && !line.startsWith("#") ? relay(line.trim(), url) : line).join("\n");
      return new NextResponse(manifest, { headers: { "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "public, max-age=1, s-maxage=1", "Access-Control-Allow-Origin": "*" } });
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=6, s-maxage=6", "Access-Control-Allow-Origin": "*", ...(upstream.headers.get("content-range") ? { "Content-Range": upstream.headers.get("content-range")! } : {}) } });
  } catch { return NextResponse.json({ error: "Live segment unavailable" }, { status: 502 }); }
}
