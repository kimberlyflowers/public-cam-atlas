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
  const [state, setState] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cameras").then((r) => r.json()).then((data) => {
      setCameras(data.cameras ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => cameras.filter((camera) => {
    const haystack = `${camera.title} ${camera.operator} ${camera.region}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (state === "all" || camera.state === state) && (category === "all" || (camera.category || "traffic") === category);
  }), [cameras, query, state, category]);

  const selectedIndex = selected ? filtered.findIndex((camera) => camera.id === selected.id) : -1;
  const selectRelative = (offset: number) => {
    if (!filtered.length) return;
    const current = selectedIndex >= 0 ? selectedIndex : 0;
    setSelected(filtered[(current + offset + filtered.length) % filtered.length]);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Camera size={18}/></span><span>Public Cam Atlas</span></div>
        <div className="source-pill"><span className="live-dot"/> Verified public feeds</div>
        <a className="about-link" href="https://www.ksat.com/ksatplus/" target="_blank" rel="noreferrer">Newest source</a>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-head">
            <p className="eyebrow">Live infrastructure</p>
            <h1>See what’s happening, right now.</h1>
            <p className="lede">Intentionally published traffic, wildlife, airport and community cameras in one searchable map.</p>
          </div>
          <label className="search-box"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a road, city, or county"/>{query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={15}/></button>}</label>
          <div className="filter-row">
            <span><SlidersHorizontal size={14}/> Region</span>
            {(["all", "California", "Texas"] as const).map((item) => <button key={item} className={state === item ? "active" : ""} onClick={() => { setState(item); setSelected(null); }}>{item}</button>)}
          </div>
          <div className="filter-row type-filter">
            <span><Camera size={14}/> Type</span>
            {(["all", "traffic", "wildlife", "airport"] as const).map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setSelected(null); }}>{item}</button>)}
          </div>
          <div className="result-meta"><strong>{loading ? "—" : filtered.length}</strong> live cameras <span>{state === "all" ? "CA + TX" : state}</span></div>
          <div className="camera-list">
            {loading ? Array.from({length: 6}).map((_, i) => <div className="skeleton" key={i}/>) : filtered.slice(0, 80).map((camera) => (
              <button className={`camera-card ${selected?.id === camera.id ? "selected" : ""}`} key={camera.id} onClick={() => setSelected(camera)}>
                {camera.previewUrl ? <>
                  {/* Camera snapshots are live proxy URLs. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/image?url=${encodeURIComponent(camera.previewUrl)}`} alt=""/>
                </> : <span className="video-preview"><Camera size={18}/><small>Live HLS</small></span>}
                <span className="card-copy"><strong>{camera.title}</strong><small>{camera.region} · {camera.streamType.replace("_", " ")}</small></span>
                <span className={`status-dot ${camera.status}`}/>
              </button>
            ))}
          </div>
          <footer>Includes direct URLs and IP-hosted streams when an operator intentionally publishes them. No IP-range scanning, login bypasses, or accidentally exposed feeds.</footer>
        </aside>
        <div className="map-stage">
          <CameraMap cameras={filtered} selected={selected} onSelect={setSelected}/>
          <div className="map-key"><span><i className="online"/> Available</span><span><i/> Not checked</span></div>
          {selected && <CameraPanel key={selected.id} camera={selected} onClose={() => setSelected(null)} onPrevious={() => selectRelative(-1)} onNext={() => selectRelative(1)} position={selectedIndex + 1} total={filtered.length}/>}
        </div>
      </section>
    </main>
  );
}
