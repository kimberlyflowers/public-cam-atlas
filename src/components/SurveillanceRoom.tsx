"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text, useTexture } from "@react-three/drei";
import { createXRStore, XR, XROrigin } from "@react-three/xr";
import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraRecord } from "@/lib/camera";

function LiveScreen({ camera, position }: { camera: CameraRecord; position: [number, number, number] }) {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);
  useEffect(() => {
    const video = document.createElement("video");
    video.muted = true; video.autoplay = true; video.playsInline = true; video.crossOrigin = "anonymous";
    let hls: Hls | undefined;
    const streamUrl = camera.streamUrl.includes("wzmedia.dot.ca.gov") ? `/api/hls?url=${encodeURIComponent(camera.streamUrl)}` : camera.streamUrl;
    if (video.canPlayType("application/vnd.apple.mpegurl")) video.src = streamUrl;
    else if (Hls.isSupported()) { hls = new Hls({ maxBufferLength: 8, liveSyncDurationCount: 2 }); hls.loadSource(streamUrl); hls.attachMedia(video); }
    const onPlaying = () => { const next = new THREE.VideoTexture(video); next.colorSpace = THREE.SRGBColorSpace; setTexture(next); };
    video.addEventListener("playing", onPlaying, { once: true });
    void video.play().catch(() => undefined);
    return () => { hls?.destroy(); video.pause(); video.removeAttribute("src"); video.load(); setTexture((value) => { value?.dispose(); return null; }); };
  }, [camera]);
  return <group position={position}>
    <RoundedBox args={[3.45, 1.95, .12]} radius={.08} smoothness={4}><meshStandardMaterial color="#07110e" metalness={.55} roughness={.3}/></RoundedBox>
    <mesh position={[0, 0, .07]}><planeGeometry args={[3.25, 1.75]}/>{texture ? <meshBasicMaterial map={texture}/> : <meshBasicMaterial color="#102a23"/>}</mesh>
    {!texture && <Text position={[0, 0, .09]} fontSize={.13} color="#67d8ae">CONNECTING LIVE FEED</Text>}
    <Text position={[-1.58, -.82, .1]} anchorX="left" fontSize={.085} maxWidth={2.9} color="#d9e8e2">{camera.title}</Text>
  </group>;
}

function Exterior({ type }: { type: string }) {
  const loadedCoastalRoom = useTexture("/images/coastal-cliffs-360.png");
  const coastalRoom = useMemo(() => { const texture = loadedCoastalRoom.clone(); texture.colorSpace = THREE.SRGBColorSpace; return texture; }, [loadedCoastalRoom]);
  const colors: Record<string, [string, string, string]> = {
    "cliff-beach": ["#73b8d2", "#167b8e", "#7d684b"], sunset: ["#e99868", "#695a83", "#352c58"], city: ["#10182c", "#10162a", "#21283b"], mountains: ["#a9d2df", "#416f83", "#4e625a"]
  };
  const [sky, water, land] = colors[type] || colors["cliff-beach"];
  if (type === "cliff-beach") return <mesh rotation={[0, Math.PI * .58, 0]}><sphereGeometry args={[42, 64, 32]}/><meshBasicMaterial map={coastalRoom} side={THREE.BackSide} toneMapped={false}/></mesh>;
  return <group position={[0, 1, -10]}>
    <mesh position={[0, 3, -2]}><planeGeometry args={[28, 12]}/><meshBasicMaterial color={sky}/></mesh>
    <mesh position={[0, -.5, -1.8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[28, 15]}/><meshStandardMaterial color={water} metalness={.35} roughness={.22}/></mesh>
    <mesh position={[-8, .1, -1]} rotation={[0, .25, 0]}><dodecahedronGeometry args={[3.4, 1]}/><meshStandardMaterial color={land} roughness={1}/></mesh>
    <mesh position={[8, .15, -1]} rotation={[0, -.25, 0]}><dodecahedronGeometry args={[3.8, 1]}/><meshStandardMaterial color={land} roughness={1}/></mesh>
    {type === "city" && Array.from({ length: 13 }).map((_, index) => <mesh key={index} position={[-7.5 + index * 1.25, 1 + (index % 4) * .35, -1]}><boxGeometry args={[.9, 2.4 + (index % 4) * .7, .8]}/><meshStandardMaterial color="#202a43" emissive="#10182d"/></mesh>)}
  </group>;
}

const xrStore = createXRStore({
  customSessionInit: { requiredFeatures: ["local-floor"] },
  offerSession: false,
  enterGrantedSession: false,
  emulate: false,
  hand: true,
  controller: true,
  anchors: false,
  layers: false,
  meshDetection: false,
  planeDetection: false,
  hitTest: false,
  domOverlay: false,
});

function XRBridge() {
  useEffect(() => {
    const target = window as Window & { enterSurveillanceVR?: () => Promise<unknown> };
    target.enterSurveillanceVR = () => xrStore.enterVR();
    return () => { delete target.enterSurveillanceVR; };
  }, []);
  return null;
}

function Room({ cameras, exterior }: { cameras: CameraRecord[]; exterior: string }) {
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => { if (glow.current) glow.current.intensity = 18 + Math.sin(clock.elapsedTime * .5) * 2; });
  const positions = useMemo(() => [[-3.6, 3.05, -4.7], [0, 3.05, -4.7], [3.6, 3.05, -4.7], [-3.6, .95, -4.7], [0, .95, -4.7], [3.6, .95, -4.7], [-3.6, -1.15, -4.7], [0, -1.15, -4.7], [3.6, -1.15, -4.7]] as [number, number, number][], []);
  return <>
    <color attach="background" args={["#06100d"]}/><fog attach="fog" args={["#06100d", 13, 30]}/>
    <ambientLight intensity={1.1}/><pointLight ref={glow} position={[0, 5, 1]} color="#78d9ba" distance={18}/>
    <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[22, 22]}/><meshStandardMaterial color="#302f2c" roughness={.34} metalness={.22}/></mesh>
    {Array.from({length:11}).map((_,i)=><mesh key={`floor-${i}`} position={[-5+i, -2.185, 0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.018,20]}/><meshBasicMaterial color="#77726a"/></mesh>)}
    <mesh position={[0, 4.7, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[22, 22]}/><meshStandardMaterial color="#4a4741" roughness={.9}/></mesh>
    {[-3.7,0,3.7].map((x)=><mesh key={`light-${x}`} position={[x,4.63,0]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[.12,9]}/><meshBasicMaterial color="#ffe0aa"/></mesh>)}
    <mesh position={[0, 1.3, -4.9]}><boxGeometry args={[12.4, 7.2, .25]}/><meshStandardMaterial color="#6b6359" roughness={.92}/></mesh>
    {Array.from({length:25}).map((_,i)=><mesh key={`slat-${i}`} position={[-5.75+i*.48,1.3,-4.72]}><boxGeometry args={[.12,7,.14]}/><meshStandardMaterial color={i%2 ? "#3c2418":"#543424"} roughness={.68}/></mesh>)}
    {cameras.map((camera, index) => <LiveScreen key={camera.id} camera={camera} position={positions[index]}/>) }
    <Exterior type={exterior}/>
    <mesh position={[5.02, 1.25, 0]} rotation={[0, -Math.PI / 2, 0]}><boxGeometry args={[11.8, 6.4, .12]}/><meshPhysicalMaterial color="#9dddec" transmission={.72} transparent opacity={.18} roughness={.06}/></mesh>
    {[-4.5, -1.5, 1.5, 4.5].map((z) => <mesh key={z} position={[4.94, 1.25, z]}><boxGeometry args={[.16, 6.5, .16]}/><meshStandardMaterial color="#111816" metalness={.8} roughness={.24}/></mesh>)}
    <mesh position={[4.94, -1.95, 0]}><boxGeometry args={[.16, .18, 11.8]}/><meshStandardMaterial color="#111816" metalness={.8}/></mesh>
    <mesh position={[4.94, 4.45, 0]}><boxGeometry args={[.16, .18, 11.8]}/><meshStandardMaterial color="#111816" metalness={.8}/></mesh>
    <RoundedBox args={[4.8, .18, 1.35]} radius={.06} position={[0, -.65, 1.5]}><meshStandardMaterial color="#33251d" roughness={.45}/></RoundedBox>
    {[-1.9,1.9].map((x)=><mesh key={`leg-${x}`} position={[x,-1.42,1.5]}><boxGeometry args={[.18,1.45,1.05]}/><meshStandardMaterial color="#171c1a" metalness={.75}/></mesh>)}
    <RoundedBox args={[1.1,.18,1.1]} radius={.08} position={[0,-1.05,3]}><meshStandardMaterial color="#171a19" roughness={.55}/></RoundedBox>
    <mesh position={[0,-.25,3]}><boxGeometry args={[.13,1.5,.13]}/><meshStandardMaterial color="#1b211f" metalness={.75}/></mesh>
    <OrbitControls target={[0, .8, -2]} minDistance={2.4} maxDistance={10} maxPolarAngle={Math.PI * .62}/>
  </>;
}

export default function SurveillanceRoom(props: { cameras: CameraRecord[]; exterior: string }) {
  return <><XRBridge/><Canvas camera={{ position: [3.8, 1.3, 5.8], fov: 58 }} dpr={[1, 1.5]}><XR store={xrStore}><XROrigin position={[0, 0, 2.8]}/><Room {...props}/></XR></Canvas></>;
}
