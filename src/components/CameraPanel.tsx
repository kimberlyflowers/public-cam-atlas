"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Maximize2, Minimize2, Radio, X } from "lucide-react";
import Hls from "hls.js";
import type { CameraRecord } from "@/lib/camera";

export function Player({ camera }: { camera: CameraRecord }) {
  const video = useRef<HTMLVideoElement>(null);
  const [stamp, setStamp] = useState(0);
  useEffect(() => {
    if (camera.streamType === "image_refresh") {
      const timer = setInterval(() => setStamp(Date.now()), (camera.refreshSeconds || 30) * 1000);
      return () => clearInterval(timer);
    }
    if (camera.streamType === "hls" && video.current) {
      if (video.current.canPlayType("application/vnd.apple.mpegurl")) video.current.src = camera.streamUrl;
      else if (Hls.isSupported()) { const hls = new Hls(); hls.loadSource(camera.streamUrl); hls.attachMedia(video.current); return () => hls.destroy(); }
    }
  }, [camera]);
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
  return <video className="player" ref={video} autoPlay muted controls playsInline/>;
}

export default function CameraPanel({ camera, onClose, onPrevious, onNext, position, total }: { camera: CameraRecord; onClose: () => void; onPrevious: () => void; onNext: () => void; position: number; total: number }) {
  const panel = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const embedded = camera.streamType === "youtube" || camera.streamType === "embed";
  const [health, setHealth] = useState<{status: string; checkedAt?: string}>({ status: embedded ? "online" : "checking" });
  useEffect(() => {
    if (camera.streamType === "youtube" || camera.streamType === "embed") return;
    fetch(`/api/status?url=${encodeURIComponent(camera.streamUrl)}`).then(r => r.json()).then(setHealth).catch(() => setHealth({status:"unknown"}));
  }, [camera.streamUrl, camera.streamType]);
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
      <div className="panel-actions"><a href={camera.sourcePage} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Verify public source</a><span><Radio size={15}/> Public livestream</span></div>
    </div>
  </article>;
}
