"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { MapItem } from "@/lib/types/map";
import { MapMarkers } from "./map-markers";

type MapSelectionLayerProps = {
  items: readonly MapItem[];
  selectedId: string | null;
  onSelect: (item: MapItem) => void;
  flyZoom?: number;
};

export function MapSelectionLayer({
  items,
  selectedId,
  onSelect,
  flyZoom = 17,
}: MapSelectionLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const selected = items.find((m) => m.id === selectedId);
    if (!selected) return;
    map.flyTo([selected.coordinates.lat, selected.coordinates.lng], Math.max(map.getZoom(), flyZoom), {
      duration: 0.6,
    });
  }, [selectedId, items, map, flyZoom]);

  return (
    <MapMarkers
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}