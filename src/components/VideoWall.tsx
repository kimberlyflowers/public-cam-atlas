"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Search, X } from "lucide-react";
import type { CameraRecord } from "@/lib/camera";
import CameraPanel, { Player } from "@/components/CameraPanel";

const WALL_SIZE = 9;

export default function VideoWall({ cameras, onClose }: { cameras: CameraRecord[]; onClose: () => void }) {
  const wall = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(WALL_SIZE);
  const [focused, setFocused] = useState<CameraRecord | null>(null);
  const matching = useMemo(() => cameras.filter((camera) => `${camera.title} ${camera.region} ${camera.county || ""} ${camera.operator}`.toLowerCase().includes(query.trim().toLowerCase())), [cameras, query]);
  const visible = useMemo(() => matching.slice(0, visibleCount), [matching, visibleCount]);
  const focusedIndex = focused ? matching.findIndex((camera) => camera.id === focused.id) : -1;
  const move = useCallback((offset: number) => {
    const element = grid.current;
    if (!element) return;
    if (offset > 0) setVisibleCount((count) => Math.min(matching.length, count + WALL_SIZE));
    requestAnimationFrame(() => requestAnimationFrame(() => element.scrollBy({ top: offset * element.clientHeight * 0.92, behavior: "smooth" })));
  }, [matching.length]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === wall.current);
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (focused && event.key === "Escape") { event.preventDefault(); setFocused(null); return; }
      if (focused) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      if (event.key === "Escape" && !document.fullscreenElement) onClose();
      if (event.key.toLowerCase() === "f" && !document.fullscreenElement) wall.current?.requestFullscreen();
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("fullscreenchange", onFullscreen); document.removeEventListener("keydown", onKey); };
  }, [focused, move, onClose]);

  const toggleFullscreen = () => fullscreen ? document.exitFullscreen() : wall.current?.requestFullscreen();
  const onGridScroll = () => {
    const element = grid.current;
    if (element && element.scrollHeight - element.scrollTop - element.clientHeight < 300) setVisibleCount((count) => Math.min(matching.length, count + WALL_SIZE));
  };
  const selectFocused = (offset: number) => {
    if (!matching.length) return;
    const index = focusedIndex >= 0 ? focusedIndex : 0;
    setFocused(matching[(index + offset + matching.length) % matching.length]);
  };
  return <section className="video-wall" ref={wall}>
    <header className="wall-header">
      <div><strong>Live camera wall</strong><span>{matching.length.toLocaleString()} cameras in this view</span></div>
      <label className="wall-search"><Search size={15}/><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(WALL_SIZE); grid.current?.scrollTo({ top: 0 }); }} placeholder="Search cameras" aria-label="Search camera wall"/>{query && <button onClick={() => { setQuery(""); setVisibleCount(WALL_SIZE); grid.current?.scrollTo({ top: 0 }); }} aria-label="Clear wall search"><X size={14}/></button>}</label>
      <button className="wall-icon" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Open fullscreen"}>{fullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
      <button className="wall-icon" onClick={onClose} aria-label="Close camera wall"><X size={20}/></button>
    </header>
    <div className="wall-grid" ref={grid} onScroll={onGridScroll}>
      {visible.map((camera, index) => <article className="wall-tile" key={camera.id}>
        <Player camera={camera} startDelayMs={index < WALL_SIZE ? index * 80 : 0} showPreview={false}/>
        <button className="wall-label" onClick={() => setFocused(camera)}><strong>{camera.title}</strong><span>{camera.region}{camera.county ? ` · ${camera.county}` : ""}</span></button>
      </article>)}
      {visible.length < matching.length && <div className="wall-loading">Scroll for more cameras</div>}
    </div>
    <footer className="wall-footer">Scroll down for more · Use ← and → for screen-sized jumps · Click any camera for details</footer>
    {focused && <div className="wall-detail"><CameraPanel key={focused.id} camera={focused} onClose={() => setFocused(null)} onPrevious={() => selectFocused(-1)} onNext={() => selectFocused(1)} position={focusedIndex + 1} total={matching.length}/></div>}
  </section>;
}
