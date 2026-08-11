import type { CameraAdapter, CameraRecord } from "@/lib/camera";

const ENDPOINT = "https://dtx-e-cdn.maplarge.com/Api/ProcessDirect";
const SOURCE_PAGE = "https://drivetexas.org/";
const FIELDS = ["route", "jurisdiction", "description", "name", "httpsurl", "imageurl", "XY"];

type ColumnData = Record<string, Array<string | null>>;

function parsePoint(value: string | null) {
  const match = value?.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
  return match ? { lng: Number(match[1]), lat: Number(match[2]) } : null;
}

export const driveTexasAdapter: CameraAdapter = {
  id: "txdot-drivetexas",
  operator: "Texas Department of Transportation",
  async fetch() {
    const request = {
      action: "table/query",
      query: { sqlselect: FIELDS, start: 0, table: "appgeo/cameraPoint", take: 5000 },
    };
    const params = new URLSearchParams({ request: JSON.stringify(request) });
    const response = await fetch(`${ENDPOINT}?${params}`, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`DriveTexas returned ${response.status}`);
    const payload = await response.json();
    if (!payload.success || !payload.authorized) throw new Error("DriveTexas public camera query unavailable");
    const columns: ColumnData = payload.data?.data ?? {};
    const count = columns.httpsurl?.length ?? 0;
    const cameras: CameraRecord[] = [];
    for (let index = 0; index < count; index++) {
      const streamUrl = String(columns.httpsurl[index] || "").trim();
      const point = parsePoint(columns.XY[index]);
      if (!point || !/\.m3u8($|\?)/i.test(streamUrl)) continue;
      const name = String(columns.name[index] || `camera-${index}`);
      const jurisdiction = String(columns.jurisdiction[index] || "TxDOT Statewide");
      const route = String(columns.route[index] || "").trim();
      const description = String(columns.description[index] || name).trim();
      cameras.push({
        id: `texas-${name}-${index}`,
        title: route && !description.includes(route) ? `${route} · ${description}` : description,
        sourceUrl: ENDPOINT,
        streamUrl,
        streamType: "hls",
        lat: point.lat,
        lng: point.lng,
        operator: "TxDOT / DriveTexas",
        sourcePage: SOURCE_PAGE,
        status: "unknown",
        lastChecked: null,
        region: jurisdiction,
        state: "Texas",
      });
    }
    return cameras;
  },
};
