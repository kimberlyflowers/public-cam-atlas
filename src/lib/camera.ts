export type StreamType = "hls" | "mjpeg" | "image_refresh";
export type CameraStatus = "online" | "offline" | "unknown";
export type CameraCategory = "traffic" | "wildlife" | "airport" | "weather" | "tourism" | "parking";

export interface CameraRecord {
  id: string;
  title: string;
  sourceUrl: string;
  streamUrl: string;
  previewUrl?: string;
  streamType: StreamType;
  lat: number;
  lng: number;
  operator: string;
  sourcePage: string;
  status: CameraStatus;
  lastChecked: string | null;
  region: string;
  state: "California" | "Texas";
  category?: CameraCategory;
  publicationEvidence?: string;
  refreshSeconds?: number;
}

export interface CameraAdapter {
  id: string;
  operator: string;
  fetch(): Promise<CameraRecord[]>;
}
