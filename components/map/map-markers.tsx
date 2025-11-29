"use client";

import type { MapItem } from "@/lib/types/map";
import { MapMarker } from "./map-marker";

type MapMarkersProps = {
  items: readonly MapItem[];
  selectedId?: string | null;
  onSelect?: (item: MapItem) => void;
};

export function MapMarkers({ items, selectedId, onSelect }: MapMarkersProps) {
  return (
    <>
      {items.map((item) => (
        <MapMarker
          key={item.id}
          item={item}
          onSelect={onSelect}
          isSelected={item.id === selectedId}
        />
      ))}
    </>
  );
}