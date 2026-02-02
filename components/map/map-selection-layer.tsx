"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { MapItem } from "@/lib/types/map";
import { MapMarkers } from "./map-markers";

type MapSelectionLayerProps = {
  items: readonly MapItem[];
  selectedId: string | null;
  onSelect: (item: MapItem) => void;
  onClearSelection?: () => void;
  flyZoom?: number;
};

export function MapSelectionLayer({
  items,
  selectedId,
  onSelect,
  onClearSelection,
  flyZoom = 19,
}: MapSelectionLayerProps) {
  const map = useMap();
  const prevSelectedId = useRef<string | null>(null);

  useMapEvents({
    click: (e) => {
      if ((e.originalEvent.target as HTMLElement).closest(".leaflet-marker-icon")) {
        return;
      }
      onClearSelection?.();
    },
  });

  useEffect(() => {
    if (selectedId) {
      const selected = items.find((m) => m.id === selectedId);
      if (selected) {
        map.flyTo([selected.coordinates.lat, selected.coordinates.lng], Math.max(map.getZoom(), flyZoom), {
          duration: 0.6,
        });
      }
      prevSelectedId.current = selectedId;
    } else if (prevSelectedId.current !== null) {
      map.flyTo(map.getCenter(), 17, {
        duration: 0.5,
      });
      prevSelectedId.current = null;
    }
  }, [selectedId, items, map, flyZoom]);

  return (
    <MapMarkers
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}