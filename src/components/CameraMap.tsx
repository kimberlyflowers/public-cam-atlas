"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { CameraRecord } from "@/lib/camera";
import "leaflet/dist/leaflet.css";

function FlyTo({ camera }: { camera: CameraRecord | null }) {
  const map = useMap();
  useEffect(() => { if (camera) map.flyTo([camera.lat, camera.lng], Math.max(map.getZoom(), 11), { duration: 0.8 }); }, [camera, map]);
  return null;
}
export default function CameraMap({ cameras, selected, onSelect }: { cameras: CameraRecord[]; selected: CameraRecord | null; onSelect: (camera: CameraRecord) => void }) {
  return <MapContainer center={[34.1, -109.5]} zoom={5} minZoom={4} className="map" zoomControl={false} preferCanvas>
    <TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
    {cameras.map((camera) => { const color = camera.state === "Texas" ? "#f4a261" : "#20dda0"; return <CircleMarker key={camera.id} center={[camera.lat, camera.lng]} radius={selected?.id === camera.id ? 9 : 5} pathOptions={{ color: selected?.id === camera.id ? "#fff" : color, fillColor: color, fillOpacity: .9, weight: selected?.id === camera.id ? 3 : 1 }} eventHandlers={{ click: () => onSelect(camera) }}><Tooltip>{camera.title}</Tooltip></CircleMarker>; })}
    <FlyTo camera={selected}/>
  </MapContainer>;
}
