import type { CameraRecord } from "@/lib/camera";

type Position = [number, number];
type CountyGeometry = { type: "Polygon"; coordinates: Position[][] } | { type: "MultiPolygon"; coordinates: Position[][][] };

const BEXAR_COUNTY_GEOJSON = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?where=STATE%3D%2748%27%20AND%20COUNTY%3D%27029%27&outFields=NAME%2CSTATE%2CCOUNTY&returnGeometry=true&outSR=4326&f=geojson";

function inRing([x, y]: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(point: Position, polygon: Position[][]) {
  return inRing(point, polygon[0]) && !polygon.slice(1).some((hole) => inRing(point, hole));
}

function contains(geometry: CountyGeometry, point: Position) {
  return geometry.type === "Polygon"
    ? inPolygon(point, geometry.coordinates)
    : geometry.coordinates.some((polygon) => inPolygon(point, polygon));
}

export async function addTexasCountyNames(cameras: CameraRecord[]) {
  try {
    const response = await fetch(BEXAR_COUNTY_GEOJSON, { next: { revalidate: 86400 } });
    if (!response.ok) return cameras;
    const data = await response.json() as { features?: Array<{ geometry: CountyGeometry }> };
    const geometry = data.features?.[0]?.geometry;
    if (!geometry) return cameras;
    return cameras.map((camera) => camera.state === "Texas" && contains(geometry, [camera.lng, camera.lat])
      ? { ...camera, county: "Bexar County" }
      : camera);
  } catch {
    return cameras;
  }
}
