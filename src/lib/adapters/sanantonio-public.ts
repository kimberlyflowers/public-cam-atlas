import type { CameraAdapter, CameraRecord } from "@/lib/camera";

const waterFeeds = [
  ["river-nueva", "San Antonio River @ East Nueva Street", "https://usgs-nims-images.s3.amazonaws.com/720/TX_San_Antonio_River_at_East_Nueva_St_in_San_Antonio/TX_San_Antonio_River_at_East_Nueva_St_in_San_Antonio_newest.jpg", 29.4212, -98.4927, "https://opencctv.org/cameras/united-states/texas/san-antonio/san-antonio-river-at-east-nueva-st-in-san-antonio-24311"],
  ["olmos-dam", "Olmos Dam on Olmos Creek", "https://usgs-nims-images.s3.amazonaws.com/720/TX_Olmos_Dam_on_Olmos_Creek_near_San_Antonio/TX_Olmos_Dam_on_Olmos_Creek_near_San_Antonio_newest.jpg", 29.4736, -98.4742, "https://opencctv.org/cameras/united-states/texas/san-antonio/olmos-dam-on-olmos-creek-near-san-antonio-24758"],
  ["medina-lake", "Medina Lake near San Antonio", "https://usgs-nims-images.s3.amazonaws.com/720/TX_Medina_Lake_near_San_Antonio/TX_Medina_Lake_near_San_Antonio_newest.jpg", 29.5402, -98.9339, "https://opencctv.org/cameras/united-states/texas/san-antonio/medina-lake-near-san-antonio-25020"],
  ["river-loop-410", "San Antonio River @ Loop 410", "https://usgs-nims-images.s3.amazonaws.com/720/TX_San_Antonio_Rv_at_Loop_410/TX_San_Antonio_Rv_at_Loop_410_newest.jpg", 29.3222, -98.4503, "https://opencctv.org/cameras/united-states/texas/san-antonio/san-antonio-rv-at-loop-410-25120"],
  ["river-mitchell", "San Antonio River @ Mitchell Street", "https://usgs-nims-images.s3.amazonaws.com/720/TX_San_Antonio_River_at_Mitchell_St_San_Antonio/TX_San_Antonio_River_at_Mitchell_St_San_Antonio_newest.jpg", 29.3930, -98.4947, "https://opencctv.org/cameras/united-states/texas/san-antonio/san-antonio-river-at-mitchell-st-san-antonio-25230"],
] as const;

export const sanAntonioPublicAdapter: CameraAdapter = {
  id: "san-antonio-public-web",
  operator: "Public web sources",
  async fetch(): Promise<CameraRecord[]> {
    const water: CameraRecord[] = waterFeeds.map(([id, title, streamUrl, lat, lng, sourcePage]) => ({
      id: `texas-usgs-${id}`, title, sourceUrl: streamUrl, streamUrl, previewUrl: streamUrl,
      streamType: "image_refresh", refreshSeconds: 3600, lat, lng, operator: "U.S. Geological Survey",
      sourcePage, status: "unknown", lastChecked: null, region: "San Antonio", state: "Texas", category: "water",
      publicationEvidence: "Unauthenticated USGS-hosted image indexed by a public webcam directory",
      discoveryMethod: "Public search indexing via OpenCCTV", accessClassification: "verified_public", authentication: "none",
      inclusionRationale: "Government-hosted feed, publicly indexed, and accessible without authentication or payment",
    }));
    return [...water, {
      id: "texas-bracken-cave-entrance", title: "Bracken Cave Entrance Live Cam", sourceUrl: "https://www.youtube.com/watch?v=jrIrspc_5RI",
      streamUrl: "https://www.youtube.com/watch?v=jrIrspc_5RI", streamType: "youtube", lat: 29.6885, lng: -98.3487,
      operator: "Bat Conservation International / Explore.org", sourcePage: "https://www.batcon.org/experience-bats/the-bat-channel/", status: "unknown", lastChecked: null,
      region: "San Antonio", state: "Texas", category: "wildlife",
      publicationEvidence: "Official Bat Conservation International page labels this as Bracken Cave Entrance (Live)",
      discoveryMethod: "Official operator live-camera page", accessClassification: "verified_public", authentication: "none",
      inclusionRationale: "The preserve operator intentionally embeds this continuous public livestream",
    }, {
      id: "texas-bracken-cave-interior", title: "Bracken Cave Interior Live Cam", sourceUrl: "https://www.youtube.com/watch?v=Ditnw8PTZUU",
      streamUrl: "https://www.youtube.com/watch?v=Ditnw8PTZUU", streamType: "youtube", lat: 29.6887, lng: -98.3485,
      operator: "Bat Conservation International / Explore.org", sourcePage: "https://www.batcon.org/experience-bats/the-bat-channel/", status: "unknown", lastChecked: null,
      region: "San Antonio", state: "Texas", category: "wildlife",
      publicationEvidence: "Official Bat Conservation International page labels this as Bracken Cave Interior (Live)",
      discoveryMethod: "Official operator live-camera page", accessClassification: "verified_public", authentication: "none",
      inclusionRationale: "The preserve operator intentionally embeds this continuous public livestream",
    }, {
      id: "texas-alamo-plaza", title: "Alamo Plaza Live Cam", sourceUrl: "https://www.thealamo.org/live-cam",
      streamUrl: "https://rtsp.me/embed/FQaa3Nd3/", streamType: "embed", lat: 29.4257, lng: -98.4861,
      operator: "The Alamo / Alamo Trust", sourcePage: "https://www.thealamo.org/live-cam", status: "unknown", lastChecked: null,
      region: "San Antonio", state: "Texas", category: "landmark",
      publicationEvidence: "Embedded on The Alamo's official public Live Cam page",
      discoveryMethod: "Public web search", accessClassification: "verified_public", authentication: "none",
      inclusionRationale: "Official operator page intentionally labels and embeds the camera for public viewing",
    }, {
      id: "texas-san-antonio-skyline", title: "Downtown San Antonio Skyline", sourceUrl: "https://www.ksat.com/features/2019/12/30/live-camera-downtown-san-antonio/",
      streamUrl: "https://public.earthcam.net/tJ90CoLmq7TzrY396Yd88LotqRGJFQ8oKI2EkE5DnEI!.tJ90CoLmq7TzrY396Yd88IQEt-U5iYkLrtMxBYSI35E!.tJ90CoLmq7TzrY396Yd88IR4_6Py5pbXly-5K9M1_vQ!",
      streamType: "embed", lat: 29.4241, lng: -98.4936, operator: "KSAT / EarthCam",
      sourcePage: "https://www.ksat.com/features/2019/12/30/live-camera-downtown-san-antonio/", status: "unknown", lastChecked: null,
      region: "San Antonio", state: "Texas", category: "landmark",
      publicationEvidence: "Embedded for public viewing on KSAT's Downtown San Antonio live-camera page",
      discoveryMethod: "Official local broadcaster page", accessClassification: "verified_public", authentication: "none",
      inclusionRationale: "KSAT intentionally publishes the EarthCam player on its public live-camera page without authentication or payment",
    }];
  },
};
