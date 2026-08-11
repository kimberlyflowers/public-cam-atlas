"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Radio, X } from "lucide-react";
import Hls from "hls.js";
import type { CameraRecord } from "@/lib/camera";

function Player({ camera }: { camera: CameraRecord }) {
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
  const [health, setHealth] = useState<{status: string; checkedAt?: string}>({ status: camera.streamType === "youtube" ? "online" : "checking" });
  useEffect(() => {
    if (camera.streamType === "youtube") return;
    fetch(`/api/status?url=${encodeURIComponent(camera.streamUrl)}`).then(r => r.json()).then(setHealth).catch(() => setHealth({status:"unknown"}));
  }, [camera.streamUrl, camera.streamType]);
  return <article className="detail-panel">
    <button className="close" onClick={onClose} aria-label="Close"><X size={18}/></button>
    <Player camera={camera}/>
    <div className="panel-body">
      <div className="panel-status"><span className={`status-dot ${health.status}`}/>{health.status === "checking" ? "Checking feed…" : health.status}</div>
      <h2>{camera.title}</h2>
      <p><MapPin size={15}/>{camera.region}</p>
      <div className="facts"><span><small>Operator</small>{camera.operator}</span><span><small>Type</small>{camera.category || "traffic"}</span><span><small>Format</small>{camera.streamType.replace("_", " ")}</span></div>
      <div className="coordinates">{camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}</div>
      {camera.publicationEvidence && <p className="evidence"><Radio size={14}/>{camera.publicationEvidence}</p>}
      <div className="sequence-controls">
        <button onClick={onPrevious} aria-label="Previous camera"><ChevronLeft size={16}/> Previous</button>
        <span>{position.toLocaleString()} of {total.toLocaleString()}</span>
        <button onClick={onNext} aria-label="Next camera">Next <ChevronRight size={16}/></button>
      </div>
      <div className="panel-actions"><a href={camera.sourcePage} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Verify public source</a><span><Radio size={15}/> Public livestream</span></div>
    </div>
  </article>;
}
