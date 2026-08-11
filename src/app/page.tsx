"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Camera, Grid3X3, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import type { CameraRecord } from "@/lib/camera";
import CameraPanel from "@/components/CameraPanel";
import VideoWall from "@/components/VideoWall";

const CameraMap = dynamic(() => import("@/components/CameraMap"), { ssr: false });

function spatialKey(camera: CameraRecord) {
  const x = Math.max(0, Math.min(65535, Math.round(((camera.lng + 180) / 360) * 65535)));
  const y = Math.max(0, Math.min(65535, Math.round(((camera.lat + 90) / 180) * 65535)));
  let key = 0;
  for (let bit = 0; bit < 16; bit++) key += ((x >> bit) & 1) * 2 ** (bit * 2) + ((y >> bit) & 1) * 2 ** (bit * 2 + 1);
  return key;
}

export default function Home() {
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [selected, setSelected] = useState<CameraRecord | null>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [category, setCategory] = useState("all");
  const [area, setArea] = useState("all");
  const [loading, setLoading] = useState(true);
  const [wallOpen, setWallOpen] = useState(false);

  useEffect(() => {
    fetch("/api/cameras").then((r) => r.json()).then((data) => {
      setCameras(data.cameras ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => cameras.filter((camera) => {
    const haystack = `${camera.title} ${camera.operator} ${camera.region} ${camera.county || ""}`.toLowerCase();
    const inArea = area === "all" || (area === "San Antonio Metro" ? camera.region === "San Antonio" || camera.county === "Bexar County" : area === "San Antonio TransGuide" ? camera.region === "San Antonio" && (camera.operator.includes("TransGuide") || camera.id === "texas-ksat-transguide") : camera.county === area);
    const matchesCategory = category === "all" || (category === "public_places" ? !["traffic", "intersection"].includes(camera.category || "traffic") : (camera.category || "traffic") === category);
    return haystack.includes(query.toLowerCase()) && (state === "all" || camera.state === state) && inArea && matchesCategory;
  }).sort((a, b) => spatialKey(a) - spatialKey(b)), [cameras, query, state, area, category]);

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
        <button className="wall-launch" onClick={() => { setSelected(null); setWallOpen(true); }} disabled={!filtered.length}><Grid3X3 size={16}/> 9-cam view</button>
        <a className="about-link" href="/sources">Source decisions</a>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-head">
            <p className="eyebrow">California · Texas · San Antonio</p>
            <h1>See what’s happening, right now.</h1>
            <p className="lede">Starts with the complete verified public-camera inventory. Narrow it to San Antonio Metro, Bexar County, Texas, California, or a camera type.</p>
          </div>
          <label className="search-box"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a road, city, or county"/>{query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={15}/></button>}</label>
          <div className="filter-grid">
            <label><span><SlidersHorizontal size={13}/> Region</span><select value={state} onChange={(event) => { const value = event.target.value; setState(value); if (value === "California") setArea("all"); setSelected(null); }}><option value="all">All regions</option><option value="Texas">Texas</option><option value="California">California</option></select></label>
            <label><span><MapPin size={13}/> Area</span><select value={area} onChange={(event) => { const value = event.target.value; setArea(value); if (value !== "all") setState("Texas"); setSelected(null); }}><option value="all">All areas</option><option value="San Antonio Metro">San Antonio Metro</option><option value="San Antonio TransGuide">San Antonio TransGuide</option><option value="Bexar County">Bexar County</option></select></label>
            <label><span><Camera size={13}/> Type</span><select value={category} onChange={(event) => { setCategory(event.target.value); setSelected(null); }}><option value="all">All camera types</option><option value="public_places">Public places</option><option value="traffic">Traffic</option><option value="intersection">Intersection</option><option value="landmark">Landmark</option><option value="wildlife">Wildlife</option><option value="airport">Airport</option><option value="tourism">Tourism</option><option value="water">Water</option></select></label>
          </div>
          <div className="result-meta"><strong>{loading ? "—" : filtered.length}</strong> live cameras <span>{area !== "all" ? area : state === "all" ? "CA + TX" : state}</span></div>
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
      {wallOpen && (
        <VideoWall key={`${query}-${state}-${area}-${category}`} cameras={filtered} onClose={() => setWallOpen(false)} onSelect={(camera) => { setWallOpen(false); setSelected(camera); }}/>
      )}
    </main>
  );
}
