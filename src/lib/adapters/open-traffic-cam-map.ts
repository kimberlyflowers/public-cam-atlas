import type { CameraAdapter, CameraRecord } from "@/lib/camera";

const DATA_URL = "https://raw.githubusercontent.com/AidanWelch/OpenTrafficCamMap/master/cameras/USA.json";
const SOURCE_PAGE = "https://github.com/AidanWelch/OpenTrafficCamMap";

type SourceCamera = {
  description: string;
  latitude: number;
  longitude: number;
  direction?: string;
  url: string;
  format: string;
};

type SourceData = Record<string, Record<string, SourceCamera[]>>;

export const openTrafficCamMapAdapter: CameraAdapter = {
  id: "open-traffic-cam-map",
  operator: "OpenTrafficCamMap / public transportation authorities",
  async fetch(): Promise<CameraRecord[]> {
    const response = await fetch(DATA_URL, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`OpenTrafficCamMap returned ${response.status}`);
    const data = await response.json() as SourceData;
    const cameras: CameraRecord[] = [];
    for (const [state, counties] of Object.entries(data)) {
      // Alabama is sourced directly from ALDOT's current ALGO v4 API. The
      // OpenTrafficCamMap Alabama entries retain retired Wowza paths.
      if (state === "Alabama") continue;
      for (const [county, entries] of Object.entries(counties)) {
        for (const [index, camera] of entries.entries()) {
          if (camera.format !== "M3U8" || !camera.url.startsWith("https://")) continue;
          cameras.push({
            id: `otcm-${state.toLowerCase().replaceAll(" ", "-")}-${county.toLowerCase().replaceAll(" ", "-")}-${index}`,
            title: camera.description || `Public traffic camera ${index + 1}`,
            sourceUrl: DATA_URL,
            streamUrl: camera.url,
            streamType: "hls",
            lat: camera.latitude,
            lng: camera.longitude,
            operator: "Public transportation authority via OpenTrafficCamMap",
            sourcePage: SOURCE_PAGE,
            status: "unknown",
            lastChecked: null,
            region: county,
            county: county === "other" ? undefined : `${county} County`,
            state,
            category: "traffic",
            publicationEvidence: "Compiled from public transportation-authority camera datasets by the MIT-licensed OpenTrafficCamMap project",
            discoveryMethod: "Licensed GitHub public-camera dataset",
            accessClassification: "verified_public",
            authentication: "none",
            inclusionRationale: "Public HLS endpoint listed in an open-source transportation-camera dataset and deduplicated against direct sources",
          });
        }
      }
    }
    return cameras;
  },
};
