import type { CameraAdapter, CameraRecord, StreamType } from "@/lib/camera";

const ENDPOINT = "https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/CCTV/MapServer/0/query";

function streamType(url: string): StreamType {
  if (/\.m3u8($|\?)/i.test(url)) return "hls";
  if (/mjpeg|mjpg/i.test(url)) return "mjpeg";
  return "image_refresh";
}

export const caltransAdapter: CameraAdapter = {
  id: "caltrans-cwwp2",
  operator: "California Department of Transportation",
  async fetch() {
    const params = new URLSearchParams({
      where: "inService = 'True' AND streamingVideoURL LIKE '%.m3u8%'",
      outFields: "OBJECTID,locationName,nearbyPlace,longitude,latitude,direction,county,route,inService,streamingVideoURL,currentImageURL,currentImageUpdateFrequency,recordDate",
      returnGeometry: "false",
      resultRecordCount: "2000",
      f: "json",
    });
    const response = await fetch(`${ENDPOINT}?${params}`, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Caltrans returned ${response.status}`);
    const payload = await response.json();
    return payload.features.map(({ attributes: a }: { attributes: Record<string, string | number | null> }): CameraRecord => {
      const streamUrl = String(a.streamingVideoURL || a.currentImageURL).trim();
      return {
        id: `caltrans-${a.OBJECTID}`,
        title: String(a.locationName || `${a.route} camera`),
        sourceUrl: ENDPOINT,
        streamUrl,
        previewUrl: a.currentImageURL ? String(a.currentImageURL) : undefined,
        streamType: streamType(streamUrl),
        lat: Number(a.latitude), lng: Number(a.longitude),
        operator: "Caltrans",
        sourcePage: "https://cwwp2.dot.ca.gov/vm/iframemap.htm",
        status: "unknown",
        lastChecked: a.recordDate ? new Date(Number(a.recordDate)).toISOString() : null,
        region: [a.nearbyPlace, a.county ? `${a.county} County` : null].filter(Boolean).join(", "),
        state: "California",
        refreshSeconds: Number(a.currentImageUpdateFrequency) || 30,
      };
    });
  },
};
