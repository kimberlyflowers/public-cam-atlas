export type StreamType = "hls" | "mjpeg" | "image_refresh" | "youtube" | "embed";
export type CameraStatus = "online" | "offline" | "unknown";
export type CameraCategory = "traffic" | "intersection" | "landmark" | "wildlife" | "airport" | "weather" | "tourism" | "parking" | "water" | "dashcam";

export interface CameraRecord {
  id: string;
  title: string;
  sourceUrl: string;
  streamUrl: string;
  dashUrl?: string;
  drmCameraId?: number;
  previewUrl?: string;
  streamType: StreamType;
  lat: number;
  lng: number;
  operator: string;
  sourcePage: string;
  status: CameraStatus;
  lastChecked: string | null;
  region: string;
  county?: string;
  state: string;
  category?: CameraCategory;
  publicationEvidence?: string;
  discoveryMethod?: string;
  accessClassification?: "verified_public" | "public_reachable_intent_unclear";
  authentication?: "none" | "required";
  inclusionRationale?: string;
  refreshSeconds?: number;
}

export interface CameraAdapter {
  id: string;
  operator: string;
  fetch(): Promise<CameraRecord[]>;
}
