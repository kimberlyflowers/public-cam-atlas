import type { CameraAdapter, CameraCategory, CameraRecord } from "@/lib/camera";

const SOURCE_PAGE = "https://www.ksat.com/ksatplus/";

const feeds: Array<{
  id: string;
  title: string;
  eventId: string;
  lat: number;
  lng: number;
  category: CameraCategory;
}> = [
  { id: "zoo-flamingo", title: "San Antonio Zoo Flamingo Cam", eventId: "ZqGZV1b-QdKY2sH4oJa79g", lat: 29.4624, lng: -98.4737, category: "wildlife" },
  { id: "zoo-whooping-crane", title: "San Antonio Zoo Whooping Crane Cam", eventId: "uhylIgWVR-ycSppGwpvckA", lat: 29.4624, lng: -98.4737, category: "wildlife" },
  { id: "zoo-hippo", title: "San Antonio Zoo Hippo Cam", eventId: "22q6sUSQT0ymZcL8Ii5IZQ", lat: 29.4624, lng: -98.4737, category: "wildlife" },
  { id: "airport", title: "San Antonio Airport Cam", eventId: "0ZdAX16iRbu-JPn2966EJw", lat: 29.5337, lng: -98.4698, category: "airport" },
  { id: "transguide", title: "San Antonio TransGuide Traffic Cams", eventId: "OjejNfeaSLK1_jS9gpAIoQ", lat: 29.4628, lng: -98.4951, category: "traffic" },
];

export const ksatAdapter: CameraAdapter = {
  id: "ksat-public-livestreams",
  operator: "KSAT 12",
  async fetch(): Promise<CameraRecord[]> {
    return feeds.map((feed) => ({
      id: `texas-ksat-${feed.id}`,
      title: feed.title,
      sourceUrl: SOURCE_PAGE,
      streamUrl: `https://pubads.g.doubleclick.net/ssai/event/${feed.eventId}/master.m3u8`,
      streamType: "hls",
      lat: feed.lat,
      lng: feed.lng,
      operator: "KSAT 12",
      sourcePage: SOURCE_PAGE,
      status: "unknown",
      lastChecked: null,
      region: "San Antonio",
      state: "Texas",
      category: feed.category,
      publicationEvidence: "Embedded and labeled for public viewing on KSAT+",
      discoveryMethod: "KSAT public livestream catalog",
      accessClassification: "verified_public",
      authentication: "none",
      inclusionRationale: "KSAT intentionally publishes the continuous feed without authentication or payment",
    }));
  },
};
