"use client";

import type { MapItem } from "@/lib/types/map";
import { MapMarker } from "./map-marker";

type MapMarkersProps = {
  items: readonly MapItem[];
  selectedId?: string | null;
  onSelect?: (item: MapItem) => void;
  onDirections?: (item: MapItem) => void;
};

export function MapMarkers({ items, selectedId, onSelect, onDirections }: MapMarkersProps) {
  const displayItems = selectedId
    ? items.filter(item => item.id === selectedId)
    : items;

  return (
    <>
      {displayItems.map((item) => (
        <MapMarker
          key={item.id}
          item={item}
          onSelect={onSelect}
          onDirections={onDirections}
          isSelected={item.id === selectedId}
        />
      ))}
    </>
  );
}