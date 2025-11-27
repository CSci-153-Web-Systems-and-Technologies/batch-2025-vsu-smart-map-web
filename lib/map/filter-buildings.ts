import type { MapMarkerPayload } from "@/lib/types/building";
import type { BuildingCategory } from "@/lib/constants/buildings";

export function filterMarkers(
  markers: readonly MapMarkerPayload[],
  term: string,
  category?: BuildingCategory | null,
) {
  const normalizedTerm = term.trim().toLowerCase();
  const filtered = markers.filter((marker) => {
    const matchesCategory = category ? marker.category === category : true;
    const matchesTerm =
      normalizedTerm.length === 0 ||
      marker.name.toLowerCase().includes(normalizedTerm) ||
      marker.code.toLowerCase().includes(normalizedTerm);
    return matchesCategory && matchesTerm;
  });

  return { results: filtered, matchCount: filtered.length };
}