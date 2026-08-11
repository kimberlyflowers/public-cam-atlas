"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPin, Radio, X } from "lucide-react";
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
  if (camera.streamType === "image_refresh") return <>
    {/* Live proxy URL is not compatible with static image optimization. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="player" src={`/api/image?url=${encodeURIComponent(camera.streamUrl)}&t=${stamp}`} alt={`Current view from ${camera.title}`}/>
  </>;
  return <video className="player" ref={video} autoPlay muted controls playsInline/>;
}

export default function CameraPanel({ camera, onClose }: { camera: CameraRecord; onClose: () => void }) {
  const [health, setHealth] = useState<{status: string; checkedAt?: string}>({ status: "checking" });
  useEffect(() => { fetch(`/api/status?url=${encodeURIComponent(camera.streamUrl)}`).then(r => r.json()).then(setHealth).catch(() => setHealth({status:"unknown"})); }, [camera.streamUrl]);
  return <article className="detail-panel">
    <button className="close" onClick={onClose} aria-label="Close"><X size={18}/></button>
    <Player camera={camera}/>
    <div className="panel-body">
      <div className="panel-status"><span className={`status-dot ${health.status}`}/>{health.status === "checking" ? "Checking feed…" : health.status}</div>
      <h2>{camera.title}</h2>
      <p><MapPin size={15}/>{camera.region}</p>
      <div className="facts"><span><small>Operator</small>{camera.operator}</span><span><small>Format</small>{camera.streamType.replace("_", " ")}</span><span><small>Refresh</small>{camera.refreshSeconds || "Live"}s</span></div>
      <div className="coordinates">{camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}</div>
      <div className="panel-actions"><a href={camera.sourcePage} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Official source</a><span><Radio size={15}/> Public agency feed</span></div>
    </div>
  </article>;
}
