import type { PathResult, TransportMode } from "@/lib/types/graph";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export async function getExternalPath(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  mode: TransportMode = 'walking'
): Promise<PathResult | null> {
  // Skip external API call if offline or no API key
  if (!MAPTILER_KEY) return null;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  const profile = mode === 'driving' ? 'car' : mode === 'cycling' ? 'bicycle' : 'walking';
  const url = `https://api.maptiler.com/routing/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?key=${MAPTILER_KEY}&alternatives=false&geometries=geojson&overview=full`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const geometry = route.geometry;
    
    if (geometry.type !== 'LineString') return null;

    const path = geometry.coordinates.map((coords: [number, number], index: number) => ({
      id: `ext-${index}`,
      lat: coords[1],
      lng: coords[0],
      type: 'node'
    }));

    return {
      path,
      totalDistance: route.distance
    };
  } catch (error) {
    console.error("External routing failed:", error);
    return null;
  }
}
