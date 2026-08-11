import type { CameraAdapter, CameraRecord } from "@/lib/camera";

const SOURCE_PAGE = "https://sanmarcostx.gov/4472/SMTXGo";

const feeds = [
  ["hopkins-charles-austin", "Hopkins @ Charles Austin", "qRYILPnsOns", 29.8848, -97.9380],
  ["hopkins-lbj", "Hopkins @ LBJ", "tDFokEet4Ys", 29.8835, -97.9410],
  ["hopkins-guadalupe", "Hopkins @ Guadalupe", "2grg7ApB_QI", 29.8829, -97.9432],
  ["post-uhland", "Post @ Uhland", "0hhjsyXRHGA", 29.9008, -97.9222],
  ["hopkins-moore", "Hopkins @ Moore", "Qj6osxu6XVI", 29.8868, -97.9472],
  ["sh123-broadway", "SH 123 @ Broadway", "MUQJubAnBmI", 29.8693, -97.9312],
  ["aquarena-thorpe", "Aquarena Springs @ Thorpe", "bYd6ChdCblg", 29.8911, -97.9281],
  ["aquarena-charles-austin", "Aquarena Springs @ Charles Austin", "fiUqVsMR8z4", 29.8895, -97.9310],
  ["aquarena-post", "Aquarena Springs @ Post Road", "MYNXvJGw0NE", 29.9004, -97.9238],
  ["hopkins-thorpe", "Hopkins @ Thorpe", "xdWLJzOlMUI", 29.8848, -97.9352],
  ["sessom-comanche", "Sessom @ Comanche", "wMsY4Sj9ljg", 29.8935, -97.9500],
  ["ih35-wonder-world", "IH 35 @ Wonder World Drive", "4Uwmss-8J5I", 29.8582, -97.9546],
  ["aquarena-sessom", "Aquarena Springs @ Sessom Drive", "S_o0_F9BiuY", 29.8891, -97.9438],
] as const;

export const sanMarcosAdapter: CameraAdapter = {
  id: "san-marcos-smtx-go",
  operator: "City of San Marcos Public Works",
  async fetch(): Promise<CameraRecord[]> {
    return feeds.map(([id, title, videoId, lat, lng]) => ({
      id: `texas-smtx-${id}`,
      title,
      sourceUrl: SOURCE_PAGE,
      streamUrl: `https://www.youtube.com/watch?v=${videoId}`,
      streamType: "youtube",
      lat,
      lng,
      operator: "City of San Marcos Public Works",
      sourcePage: SOURCE_PAGE,
      status: "unknown",
      lastChecked: null,
      region: "San Marcos",
      state: "Texas",
      category: "intersection",
      publicationEvidence: "Published by the City of San Marcos for live monitoring; the city states these feeds are not recorded",
    }));
  },
};
