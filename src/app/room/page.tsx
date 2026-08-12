"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Glasses, MonitorPlay } from "lucide-react";
import { useEffect, useState } from "react";
import type { CameraRecord } from "@/lib/camera";

const SurveillanceRoom = dynamic(() => import("@/components/SurveillanceRoom"), { ssr: false });

export default function RoomPage() {
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [scene, setScene] = useState("cliff-beach");
  const [vrStatus, setVrStatus] = useState("Checking VR…");
  useEffect(() => {
    fetch("/api/cameras").then((response) => response.json()).then((data) => {
      setCameras((data.cameras || []).filter((camera: CameraRecord) => camera.streamType === "hls").slice(0, 9));
    }).catch(() => undefined);
    navigator.xr?.isSessionSupported("immersive-vr").then((supported) => setVrStatus(supported ? "VR ready" : "Immersive VR unavailable")).catch(() => setVrStatus("Immersive VR unavailable"));
  }, []);
  const enterVR = () => {
    const enter = (window as Window & { enterSurveillanceVR?: () => Promise<unknown> }).enterSurveillanceVR;
    if (!enter) { setVrStatus("Room is still loading…"); return; }
    setVrStatus("Entering VR…");
    void enter().then(() => setVrStatus("VR active")).catch((error: unknown) => setVrStatus(error instanceof Error ? error.message : "Quest rejected the VR session"));
  };
  return <main className="room-page">
    <div className="room-hud">
      <Link href="/"><ArrowLeft size={17}/> Map</Link>
      <div><MonitorPlay size={18}/><span><strong>Surveillance Room</strong><small>{cameras.length ? `${cameras.length} live walls` : "Opening feeds…"}</small></span></div>
      <label>Outside<select value={scene} onChange={(event) => setScene(event.target.value)}><option value="cliff-beach">Cliffs + beach</option><option value="sunset">Ocean sunset</option><option value="city">Night city</option><option value="mountains">Alpine lake</option></select></label>
      <button id="enter-vr" onClick={enterVR}><Glasses size={17}/> Enter VR</button>
    </div>
    <SurveillanceRoom cameras={cameras} exterior={scene}/>
    <div className="room-help">{vrStatus} · Drag to look · Scroll to move</div>
  </main>;
}
