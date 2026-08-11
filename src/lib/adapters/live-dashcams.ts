import type { CameraAdapter, CameraRecord } from "@/lib/camera";

const candidates = [
  { id: "RXKT2POJbfY", title: "Switzerland live scenic-road drive", operator: "Army Life Guide", region: "Switzerland", state: "International", lat: 46.8182, lng: 8.2275 },
  { id: "wDaV8EkYHmk", title: "London bus road-view livestream", operator: "kidney beans global", region: "London", state: "International", lat: 51.5072, lng: -0.1276 },
  { id: "DaHHb4OfZpw", title: "NYC taxi street dashcam", operator: "Sounds Of The City", region: "New York City", state: "New York", lat: 40.7128, lng: -74.006 },
] as const;

async function isLive(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { next: { revalidate: 300 } });
    if (!response.ok) return false;
    const page = await response.text();
    return page.includes('"isLiveNow":true');
  } catch { return false; }
}

export const liveDashcamsAdapter: CameraAdapter = {
  id: "owner-operated-live-dashcams",
  operator: "Independent public dashcam broadcasters",
  async fetch(): Promise<CameraRecord[]> {
    const live = await Promise.all(candidates.map(async (candidate) => ({ candidate, live: await isLive(candidate.id) })));
    return live.flatMap(({ candidate, live: currentlyLive }): CameraRecord[] => currentlyLive ? [{
      id: `dashcam-youtube-${candidate.id}`,
      title: candidate.title,
      sourceUrl: `https://www.youtube.com/watch?v=${candidate.id}`,
      streamUrl: `https://www.youtube.com/watch?v=${candidate.id}`,
      streamType: "youtube",
      lat: candidate.lat,
      lng: candidate.lng,
      operator: candidate.operator,
      sourcePage: `https://www.youtube.com/watch?v=${candidate.id}`,
      status: "online",
      lastChecked: new Date().toISOString(),
      region: candidate.region,
      state: candidate.state,
      category: "dashcam",
      publicationEvidence: "The camera operator is currently broadcasting this road-view feed publicly on YouTube Live",
      discoveryMethod: "Public owner-operated live broadcast",
      accessClassification: "verified_public",
      authentication: "none",
      inclusionRationale: "Currently-live source broadcast; recorded uploads and dashcam compilations are excluded",
    }] : []);
  },
};
