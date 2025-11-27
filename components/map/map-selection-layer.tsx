"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { MapMarkerPayload } from "@/lib/types/building";
import { BuildingMarkers } from "./building-markers";

type MapSelectionLayerProps = {
  markers: readonly MapMarkerPayload[];
  selectedId: string | null;
  onSelect: (marker: MapMarkerPayload) => void;
  flyZoom?: number;
};

export function MapSelectionLayer({
  markers,
  selectedId,
  onSelect,
  flyZoom = 17,
}: MapSelectionLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const selected = markers.find((m) => m.id === selectedId);
    if (!selected) return;
    map.flyTo([selected.coordinates.lat, selected.coordinates.lng], Math.max(map.getZoom(), flyZoom), {
      duration: 0.6,
    });
  }, [selectedId, markers, map, flyZoom]);

  return (
    <BuildingMarkers
      markers={markers}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}