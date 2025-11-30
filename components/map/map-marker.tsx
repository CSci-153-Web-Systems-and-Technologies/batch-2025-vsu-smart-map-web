"use client";

import { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import { divIcon, type DivIcon } from "leaflet";
import { getPinAssetForCategory } from "@/lib/map/pins";
import type { MapItem } from "@/lib/types/map";

type MapMarkerProps = {
  item: MapItem;
  isSelected?: boolean;
  onSelect?: (item: MapItem) => void;
};

export function MapMarker({ item, isSelected = false, onSelect }: MapMarkerProps) {
  const icon: DivIcon = useMemo(() => {
    const category = item.category ?? "academic";
    const pin = getPinAssetForCategory(category, { selected: isSelected });
    return divIcon({
      html: pin.html,
      className: pin.className,
      iconSize: pin.iconSize,
      iconAnchor: pin.iconAnchor,
      tooltipAnchor: pin.tooltipAnchor,
    });
  }, [item.category, isSelected]);

  const position: [number, number] = [item.coordinates.lat, item.coordinates.lng];

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onSelect?.(item),
        keypress: (e) => {
          const key = e.originalEvent.key;
          if (key === "Enter" || key === " ") {
            onSelect?.(item);
          }
        },
      }}
      title={item.code ? `${item.name} (${item.code})` : item.name}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        {item.name}
      </Tooltip>
    </Marker>
  );
}
