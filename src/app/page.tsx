"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Camera, Search, SlidersHorizontal, X } from "lucide-react";
import type { CameraRecord } from "@/lib/camera";
import CameraPanel from "@/components/CameraPanel";

const CameraMap = dynamic(() => import("@/components/CameraMap"), { ssr: false });

export default function Home() {
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [selected, setSelected] = useState<CameraRecord | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cameras").then((r) => r.json()).then((data) => {
      setCameras(data.cameras ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => cameras.filter((camera) => {
    const haystack = `${camera.title} ${camera.operator} ${camera.region}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === "all" || camera.status === status);
  }), [cameras, query, status]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Camera size={18}/></span><span>Public Cam Atlas</span></div>
        <div className="source-pill"><span className="live-dot"/> Official feeds only</div>
        <a className="about-link" href="https://dot.ca.gov/" target="_blank" rel="noreferrer">Data policy</a>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-head">
            <p className="eyebrow">Live infrastructure</p>
            <h1>See what’s happening, right now.</h1>
            <p className="lede">Publicly operated road cameras in one calm, searchable map.</p>
          </div>
          <label className="search-box"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a road, city, or county"/>{query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={15}/></button>}</label>
          <div className="filter-row">
            <span><SlidersHorizontal size={14}/> Status</span>
            {(["all", "online", "unknown"] as const).map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>)}
          </div>
          <div className="result-meta"><strong>{loading ? "—" : filtered.length}</strong> cameras <span>California · Caltrans</span></div>
          <div className="camera-list">
            {loading ? Array.from({length: 6}).map((_, i) => <div className="skeleton" key={i}/>) : filtered.slice(0, 80).map((camera) => (
              <button className={`camera-card ${selected?.id === camera.id ? "selected" : ""}`} key={camera.id} onClick={() => setSelected(camera)}>
                {/* Camera snapshots are live proxy URLs, so Next image optimization is intentionally bypassed. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/image?url=${encodeURIComponent(camera.streamUrl)}`} alt=""/>
                <span className="card-copy"><strong>{camera.title}</strong><small>{camera.region} · {camera.streamType.replace("_", " ")}</small></span>
                <span className={`status-dot ${camera.status}`}/>
              </button>
            ))}
          </div>
          <footer>Sources are included only when published by a public operator. No IP scanning or private feeds.</footer>
        </aside>
        <div className="map-stage">
          <CameraMap cameras={filtered} selected={selected} onSelect={setSelected}/>
          <div className="map-key"><span><i className="online"/> Available</span><span><i/> Not checked</span></div>
          {selected && <CameraPanel key={selected.id} camera={selected} onClose={() => setSelected(null)}/>} 
        </div>
      </section>
    </main>
  );
}
