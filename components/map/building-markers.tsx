"use client";

import type { MapMarkerPayload } from "@/lib/types/building";
import { BuildingMarker } from "./building-marker";

type BuildingMarkersProps = {
  markers: readonly MapMarkerPayload[];
  selectedId?: string | null;
  onSelect?: (building: MapMarkerPayload) => void;
};

export function BuildingMarkers({ markers, selectedId, onSelect }: BuildingMarkersProps) {
  return (
    <>
      {markers.map((marker) => (
        <BuildingMarker
          key={marker.id}
          building={marker}
          onSelect={onSelect}
          isSelected={marker.id === selectedId}
        />
      ))}
    </>
  );
}