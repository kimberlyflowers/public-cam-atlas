import type { CameraAdapter, CameraRecord } from "@/lib/camera";

const API_URL = "https://api.algotraffic.com/v4.0/Cameras";
const SOURCE_PAGE = "https://algotraffic.com/Cameras/";

type AlgoCamera = {
  id: number;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    county?: string;
    displayRouteDesignator?: string;
    displayCrossStreet?: string;
    direction?: string;
  };
  responsibleRegion?: string;
  playbackUrls?: { hls?: string; dash?: string };
  accessLevel?: string;
  permLink?: string;
  snapshotImageUrl?: string;
};

export const algoTrafficAdapter: CameraAdapter = {
  id: "algo-traffic",
  operator: "Alabama Department of Transportation (ALDOT)",
  async fetch(): Promise<CameraRecord[]> {
    const response = await fetch(API_URL, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`ALGO Traffic returned ${response.status}`);
    const data = await response.json() as AlgoCamera[];

    return data.flatMap((camera): CameraRecord[] => {
      const hls = camera.playbackUrls?.hls;
      if (camera.accessLevel !== "Public" || !hls?.startsWith("https://")) return [];
      const location = camera.location;
      const route = location.displayRouteDesignator?.trim();
      const crossStreet = location.displayCrossStreet?.trim();
      const title = [route, crossStreet && `at ${crossStreet}`, location.direction && `(${location.direction})`]
        .filter(Boolean)
        .join(" ") || `ALDOT Camera ${camera.id}`;

      return [{
        id: `algo-${camera.id}`,
        title,
        sourceUrl: API_URL,
        streamUrl: camera.snapshotImageUrl!,
        previewUrl: camera.snapshotImageUrl,
        streamType: "image_refresh",
        refreshSeconds: 5,
        lat: location.latitude,
        lng: location.longitude,
        operator: "Alabama Department of Transportation (ALDOT) / ALGO Traffic",
        sourcePage: camera.permLink || SOURCE_PAGE,
        status: "unknown",
        lastChecked: null,
        region: location.city || camera.responsibleRegion || location.county || "Alabama",
        county: location.county ? `${location.county} County` : undefined,
        state: "Alabama",
        category: crossStreet ? "intersection" : "traffic",
        publicationEvidence: "Listed as Public by the current official ALGO Traffic v4 camera service",
        discoveryMethod: "Official ALDOT public camera API",
        accessClassification: "verified_public",
        authentication: "none",
        inclusionRationale: "Current official ALDOT camera image; the source link opens ALGO's DRM-protected continuous player",
      }];
    });
  },
};
