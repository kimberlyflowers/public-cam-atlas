"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";
import type { CameraRecord } from "@/lib/camera";
import { Player } from "@/components/CameraPanel";

const WALL_SIZE = 9;

export default function VideoWall({ cameras, onClose, onSelect }: { cameras: CameraRecord[]; onClose: () => void; onSelect: (camera: CameraRecord) => void }) {
  const wall = useRef<HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const pageCount = Math.max(1, Math.ceil(cameras.length / WALL_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(() => cameras.slice(safePage * WALL_SIZE, safePage * WALL_SIZE + WALL_SIZE), [cameras, safePage]);
  const move = useCallback((offset: number) => setPage((current) => (current + offset + pageCount) % pageCount), [pageCount]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === wall.current);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      if (event.key === "Escape" && !document.fullscreenElement) onClose();
      if (event.key.toLowerCase() === "f" && !document.fullscreenElement) wall.current?.requestFullscreen();
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("fullscreenchange", onFullscreen); document.removeEventListener("keydown", onKey); };
  }, [move, onClose]);

  const toggleFullscreen = () => fullscreen ? document.exitFullscreen() : wall.current?.requestFullscreen();
  return <section className="video-wall" ref={wall}>
    <header className="wall-header">
      <div><strong>Live camera wall</strong><span>{cameras.length.toLocaleString()} cameras in this view</span></div>
      <div className="wall-nav">
        <button onClick={() => move(-1)} aria-label="Previous nine cameras"><ChevronLeft size={18}/> Previous 9</button>
        <span>{safePage + 1} / {pageCount}</span>
        <button onClick={() => move(1)} aria-label="Next nine cameras">Next 9 <ChevronRight size={18}/></button>
      </div>
      <button className="wall-icon" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Open fullscreen"}>{fullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
      <button className="wall-icon" onClick={onClose} aria-label="Close camera wall"><X size={20}/></button>
    </header>
    <div className="wall-grid">
      {Array.from({ length: WALL_SIZE }, (_, index) => {
        const camera = visible[index];
        return camera ? <article className="wall-tile" key={camera.id}>
          <Player camera={camera}/>
          <button className="wall-label" onClick={() => onSelect(camera)}><strong>{camera.title}</strong><span>{camera.region}{camera.county ? ` · ${camera.county}` : ""}</span></button>
        </article> : <div className="wall-tile wall-empty" key={`empty-${index}`}>No camera</div>;
      })}
    </div>
    <footer className="wall-footer">Use ← and → to move through nine cameras at a time · Press F for fullscreen</footer>
  </section>;
}
