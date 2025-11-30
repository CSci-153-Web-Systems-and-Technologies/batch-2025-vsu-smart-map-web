"use client";

import type { FacilityMarkerPayload, FacilityCategory } from "@/lib/types/facility";
import { FacilityMarker } from "./facility-marker";

interface FacilityMarkersProps {
  facilities: FacilityMarkerPayload[];
  selectedId?: string;
  visibleCategories?: FacilityCategory[];
  onMarkerClick?: (facility: FacilityMarkerPayload) => void;
}

/**
 * Render multiple facility markers with optional category filtering.
 */
export function FacilityMarkers({
  facilities,
  selectedId,
  visibleCategories,
  onMarkerClick,
}: FacilityMarkersProps) {
  const filtered = visibleCategories
    ? facilities.filter((f) => visibleCategories.includes(f.category))
    : facilities;

  return (
    <>
      {filtered.map((facility) => (
        <FacilityMarker
          key={facility.id}
          facility={facility}
          selected={facility.id === selectedId}
          onClick={onMarkerClick}
        />
      ))}
    </>
  );
}
