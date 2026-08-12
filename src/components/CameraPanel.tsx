"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Maximize2, Minimize2, Radio, X } from "lucide-react";
import Hls from "hls.js";
import type { CameraRecord } from "@/lib/camera";

function AlgoPlayer({ camera }: { camera: CameraRecord }) {
  const container = useRef<HTMLDivElement>(null);
  const [playback, setPlayback] = useState<"connecting" | "playing" | "unavailable">("connecting");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!container.current || !camera.dashUrl || !camera.drmCameraId) return;
    const host = container.current;
    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered");
    host.appendChild(videoElement);
    let player: { dispose: () => void } | undefined;
    let cancelled = false;
    const start = async () => {
      try {
        const robustnessLevels = ["HW_SECURE_ALL", "HW_SECURE_DECODE", "SW_SECURE_DECODE", "SW_SECURE_CRYPTO"];
        let videoRobustness: string | undefined;
        for (const robustness of robustnessLevels) {
          try {
            await navigator.requestMediaKeySystemAccess("com.widevine.alpha", [{ initDataTypes: ["cenc"], videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"', robustness }, { contentType: 'video/webm; codecs="vp9"', robustness }] }]);
            videoRobustness = robustness;
            break;
          } catch { /* Try the next supported Widevine robustness level. */ }
        }
        if (!videoRobustness) throw new Error("Widevine is unavailable in this browser");
        const [videoJsModule] = await Promise.all([import("video.js"), import("videojs-contrib-eme")]);
        if (cancelled) return;
        const videojs = videoJsModule.default;
        const instance = videojs(videoElement, { autoplay: true, muted: true, controls: true, fill: true, poster: camera.previewUrl });
        player = instance;
        (instance as typeof instance & { eme: () => void }).eme();
        let userId = localStorage.getItem("algo-drm-user-id");
        if (!userId) { userId = crypto.randomUUID(); localStorage.setItem("algo-drm-user-id", userId); }
        const licenseUrl = `https://widevine-dash.ezdrm.com/proxy?pX=E78674&user_id=${encodeURIComponent(userId)}&cameraId=${camera.drmCameraId}&application=trafficweb`;
        instance.src({ src: camera.dashUrl, type: "application/dash+xml", keySystems: { "com.widevine.alpha": { videoRobustness, getLicense: (_options: unknown, message: ArrayBuffer, callback: (error: Error | null, license?: ArrayBuffer) => void) => { fetch(licenseUrl, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: message }).then(async (response) => { if (!response.ok) throw new Error(`DRM license returned ${response.status}`); const license = await response.arrayBuffer(); if (!license.byteLength) throw new Error("Empty DRM license response"); callback(null, license); }).catch((error: Error) => callback(error)); } } } } as never);
        instance.on("playing", () => setPlayback("playing"));
        instance.on("error", () => setPlayback("unavailable"));
        await instance.play()?.catch(() => undefined);
      } catch { setPlayback("unavailable"); }
    };
    void start();
    return () => { cancelled = true; player?.dispose(); if (videoElement.isConnected) videoElement.remove(); };
  }, [camera, attempt]);
  /* Live snapshot proxy is intentionally rendered without image optimization. */
  /* eslint-disable @next/next/no-img-element */
  return <div className="player-frame algo-player">
    <div ref={container} className="player"/>
    {playback === "unavailable" && camera.previewUrl && <img className="player algo-fallback" src={`/api/image?url=${encodeURIComponent(camera.previewUrl)}&t=${attempt}`} alt={`Latest view from ${camera.title}`}/>}
    {playback !== "playing" && <div className={`playback-state ${playback}`}><span>{playback === "connecting" ? "Opening licensed ALDOT live video…" : "Live video unavailable in this browser — showing latest image"}</span>{playback === "unavailable" && <button onClick={() => { setPlayback("connecting"); setAttempt((value) => value + 1); }}>Retry live video</button>}</div>}
  </div>;
}
/* eslint-enable @next/next/no-img-element */

function StandardPlayer({ camera, startDelayMs = 0, showPreview = true }: { camera: CameraRecord; startDelayMs?: number; showPreview?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [stamp, setStamp] = useState(0);
  const [playback, setPlayback] = useState<"connecting" | "playing" | "retrying" | "unavailable">("connecting");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (camera.streamType === "image_refresh") {
      const timer = setInterval(() => setStamp(Date.now()), (camera.refreshSeconds || 30) * 1000);
      return () => clearInterval(timer);
    }
    if (camera.streamType === "hls" && video.current) {
      const element = video.current;
      let hls: Hls | undefined;
      let retries = 0;
      let retryTimer: ReturnType<typeof setTimeout> | undefined;
      let stopped = false;
      let nativeErrorHandler: (() => void) | undefined;
      const startTimer = setTimeout(() => {
        setPlayback("connecting");
        if (element.canPlayType("application/vnd.apple.mpegurl")) {
          const reconnectNative = () => {
            if (stopped) return;
            setPlayback(retries ? "retrying" : "connecting");
            element.src = camera.streamUrl;
            element.load();
            element.play().catch(() => undefined);
          };
          nativeErrorHandler = () => {
            if (retries >= 2) { setPlayback("unavailable"); return; }
            retries += 1;
            retryTimer = setTimeout(reconnectNative, retries * 800);
          };
          element.addEventListener("error", nativeErrorHandler);
          reconnectNative();
          return;
        }
        if (!Hls.isSupported()) { setPlayback("unavailable"); return; }
        const connect = () => {
          if (stopped) return;
          hls?.destroy();
          setPlayback(retries ? "retrying" : "connecting");
          hls = new Hls({ lowLatencyMode: false, maxBufferLength: 12, backBufferLength: 0, liveSyncDurationCount: 2, liveMaxLatencyDurationCount: 5, manifestLoadingTimeOut: 6000, levelLoadingTimeOut: 6000, fragLoadingTimeOut: 8000 });
          hls.loadSource(camera.streamUrl);
          hls.attachMedia(element);
          hls.on(Hls.Events.MANIFEST_PARSED, () => element.play().catch(() => undefined));
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { setPlayback("retrying"); hls?.recoverMediaError(); return; }
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && retries < 2) {
              retries += 1;
              setPlayback("retrying");
              hls?.destroy();
              retryTimer = setTimeout(connect, retries * 800);
              return;
            }
            setPlayback("unavailable");
            hls?.destroy();
          });
        };
        connect();
      }, startDelayMs);
      return () => { stopped = true; clearTimeout(startTimer); if (retryTimer) clearTimeout(retryTimer); if (nativeErrorHandler) element.removeEventListener("error", nativeErrorHandler); hls?.destroy(); if (element.isConnected) { element.removeAttribute("src"); element.load(); } };
    }
  }, [camera, attempt, startDelayMs]);
  if (camera.streamType === "embed") return <iframe className="player" src={camera.streamUrl} title={`Live view from ${camera.title}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>;
  if (camera.streamType === "youtube") {
    const videoId = new URL(camera.streamUrl).searchParams.get("v");
    return <iframe className="player" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1`} title={`Live view from ${camera.title}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>;
  }
  if (camera.streamType === "image_refresh") return <>
    {/* Live proxy URL is not compatible with static image optimization. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="player" src={`/api/image?url=${encodeURIComponent(camera.streamUrl)}&t=${stamp}`} alt={`Current view from ${camera.title}`}/>
  </>;
  /* Live proxy URL is intentionally rendered without Next image optimization. */
  /* eslint-disable @next/next/no-img-element */
  const previewUrl = showPreview ? camera.previewUrl : undefined;
  return <div className={`player-frame ${previewUrl ? "has-preview" : ""}`}>
    {previewUrl && <img className="player player-preview" src={`/api/image?url=${encodeURIComponent(previewUrl)}&t=${stamp}`} alt={`Latest view from ${camera.title}`}/>}
    <video className="player player-video" ref={video} autoPlay muted controls playsInline style={playback === "playing" || hasPlayed || !previewUrl ? undefined : { opacity: 0 }} onPlaying={() => { setHasPlayed(true); setPlayback("playing"); }} onWaiting={() => setPlayback((value) => value === "playing" ? "retrying" : value)} onError={() => setPlayback("unavailable")}/>
    {playback !== "playing" && <div className={`playback-state ${playback}`}><span>{playback === "connecting" ? previewUrl ? "Opening live video — showing current official image" : "Connecting to live video…" : playback === "retrying" ? previewUrl ? "Reconnecting video — current image remains live" : "Live video buffering…" : previewUrl ? "Video is currently unavailable — showing current official image" : "Live feed is not responding"}</span>{playback === "unavailable" && <button onClick={() => setAttempt((value) => value + 1)}>Retry video</button>}</div>}
  </div>;
}

export function Player(props: { camera: CameraRecord; startDelayMs?: number; showPreview?: boolean }) {
  if (props.camera.dashUrl && props.camera.drmCameraId) return <AlgoPlayer camera={props.camera}/>;
  return <StandardPlayer {...props}/>;
}

export default function CameraPanel({ camera, onClose, onPrevious, onNext, position, total }: { camera: CameraRecord; onClose: () => void; onPrevious: () => void; onNext: () => void; position: number; total: number }) {
  const panel = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const embedded = camera.streamType === "youtube" || camera.streamType === "embed" || camera.category === "dashcam";
  const [health, setHealth] = useState<{status: string; checkedAt?: string}>({ status: embedded ? "online" : "checking" });
  useEffect(() => {
    if (camera.streamType === "youtube" || camera.streamType === "embed" || camera.category === "dashcam") return;
    fetch(`/api/status?url=${encodeURIComponent(camera.streamUrl)}`).then(r => r.json()).then(setHealth).catch(() => setHealth({status:"unknown"}));
  }, [camera.streamUrl, camera.streamType, camera.category]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === panel.current);
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); onPrevious(); }
      if (event.key === "ArrowRight") { event.preventDefault(); onNext(); }
      if (event.key.toLowerCase() === "f") { event.preventDefault(); panel.current?.requestFullscreen(); }
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("fullscreenchange", onFullscreen); document.removeEventListener("keydown", onKey); };
  }, [onNext, onPrevious]);
  const toggleFullscreen = () => fullscreen ? document.exitFullscreen() : panel.current?.requestFullscreen();
  return <article className="detail-panel" ref={panel}>
    <button className="close" onClick={onClose} aria-label="Close"><X size={18}/></button>
    <button className="fullscreen" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Open fullscreen"}>{fullscreen ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button>
    <Player camera={camera}/>
    <div className="panel-body">
      <div className="panel-status"><span className={`status-dot ${health.status}`}/>{health.status === "checking" ? "Checking feed…" : health.status}</div>
      <h2>{camera.title}</h2>
      <p><MapPin size={15}/>{camera.region}{camera.county ? ` · ${camera.county}` : ""}</p>
      <div className="facts"><span><small>Operator</small>{camera.operator}</span><span><small>Type</small>{camera.category || "traffic"}</span><span><small>Format</small>{camera.streamType.replace("_", " ")}</span></div>
      <div className="coordinates">{camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}</div>
      {camera.publicationEvidence && <p className="evidence"><Radio size={14}/>{camera.publicationEvidence}</p>}
      <div className="provenance"><span><small>Discovery</small>{camera.discoveryMethod || "Public operator dataset"}</span><span><small>Access</small>{camera.authentication === "required" ? "Authentication required" : "No authentication or paywall"}</span><span><small>Classification</small>{camera.accessClassification === "public_reachable_intent_unclear" ? "Publicly reachable — intent unclear" : "Verified public"}</span><p>{camera.inclusionRationale || camera.publicationEvidence || "Included from a publicly accessible operator source"}</p></div>
      <div className="sequence-controls">
        <button onClick={onPrevious} aria-label="Previous nearby camera"><ChevronLeft size={16}/> Previous</button>
        <span>{position.toLocaleString()} of {total.toLocaleString()}</span>
        <button onClick={onNext} aria-label="Next nearby camera">Next <ChevronRight size={16}/></button>
      </div>
      <div className="panel-actions"><a href={camera.sourcePage} target="_blank" rel="noreferrer"><ExternalLink size={15}/>{camera.state === "Alabama" ? "Open ALDOT live video" : "Verify public source"}</a><span><Radio size={15}/>{camera.streamType === "image_refresh" ? "Live camera image" : "Public livestream"}</span></div>
    </div>
  </article>;
}
