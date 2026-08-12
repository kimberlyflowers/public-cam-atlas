"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text } from "@react-three/drei";
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
    if (video.canPlayType("application/vnd.apple.mpegurl")) video.src = camera.streamUrl;
    else if (Hls.isSupported()) { hls = new Hls({ maxBufferLength: 8, liveSyncDurationCount: 2 }); hls.loadSource(camera.streamUrl); hls.attachMedia(video); }
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
  const colors: Record<string, [string, string, string]> = {
    "cliff-beach": ["#73b8d2", "#167b8e", "#7d684b"], sunset: ["#e99868", "#695a83", "#352c58"], city: ["#10182c", "#10162a", "#21283b"], mountains: ["#a9d2df", "#416f83", "#4e625a"]
  };
  const [sky, water, land] = colors[type] || colors["cliff-beach"];
  return <group position={[0, 1, -10]}>
    <mesh position={[0, 3, -2]}><planeGeometry args={[28, 12]}/><meshBasicMaterial color={sky}/></mesh>
    <mesh position={[0, -.5, -1.8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[28, 15]}/><meshStandardMaterial color={water} metalness={.35} roughness={.22}/></mesh>
    <mesh position={[-8, .1, -1]} rotation={[0, .25, 0]}><dodecahedronGeometry args={[3.4, 1]}/><meshStandardMaterial color={land} roughness={1}/></mesh>
    <mesh position={[8, .15, -1]} rotation={[0, -.25, 0]}><dodecahedronGeometry args={[3.8, 1]}/><meshStandardMaterial color={land} roughness={1}/></mesh>
    {type === "city" && Array.from({ length: 13 }).map((_, index) => <mesh key={index} position={[-7.5 + index * 1.25, 1 + (index % 4) * .35, -1]}><boxGeometry args={[.9, 2.4 + (index % 4) * .7, .8]}/><meshStandardMaterial color="#202a43" emissive="#10182d"/></mesh>)}
  </group>;
}

const xrStore = createXRStore({ bounded: false, hand: true, controller: true });

function XRBridge() {
  useEffect(() => {
    const enter = () => void xrStore.enterVR().catch(() => alert("Meta Quest Browser did not grant immersive VR. Refresh the page and allow the VR permission prompt."));
    window.addEventListener("surveillance-enter-vr", enter);
    return () => window.removeEventListener("surveillance-enter-vr", enter);
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
    <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[22, 22]}/><meshStandardMaterial color="#101916" roughness={.72} metalness={.18}/></mesh>
    <mesh position={[0, 4.7, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[22, 22]}/><meshStandardMaterial color="#111a17"/></mesh>
    <mesh position={[0, 1.3, -4.9]}><boxGeometry args={[12.4, 7.2, .25]}/><meshStandardMaterial color="#101b18" metalness={.3}/></mesh>
    {cameras.map((camera, index) => <LiveScreen key={camera.id} camera={camera} position={positions[index]}/>) }
    <group rotation={[0, -Math.PI / 2, 0]}><Exterior type={exterior}/></group>
    <mesh position={[5.02, 1.25, 0]} rotation={[0, -Math.PI / 2, 0]}><boxGeometry args={[11.8, 6.4, .12]}/><meshPhysicalMaterial color="#9dddec" transmission={.72} transparent opacity={.18} roughness={.06}/></mesh>
    <OrbitControls target={[0, .8, -2]} minDistance={2.4} maxDistance={10} maxPolarAngle={Math.PI * .62}/>
  </>;
}

export default function SurveillanceRoom(props: { cameras: CameraRecord[]; exterior: string }) {
  return <><XRBridge/><Canvas camera={{ position: [3.8, 1.3, 5.8], fov: 58 }} dpr={[1, 1.5]}><XR store={xrStore}><XROrigin position={[0, 0, 2.8]}/><Room {...props}/></XR></Canvas></>;
}
