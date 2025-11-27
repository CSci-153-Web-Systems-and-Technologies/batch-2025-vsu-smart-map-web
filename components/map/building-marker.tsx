"use client";

import { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import { divIcon, type DivIcon } from "leaflet";
import { getPinAsset } from "@/lib/map/pins";
import type { MapMarkerPayload } from "@/lib/types/building";

type BuildingMarkerProps = {
  building: MapMarkerPayload;
  onSelect?: (building: MapMarkerPayload) => void;
  isSelected?: boolean;
};

export function BuildingMarker({ building, onSelect, isSelected = false }: BuildingMarkerProps) {
  const icon: DivIcon = useMemo(() => {
    const pin = getPinAsset(building.category, { selected: isSelected });
    return divIcon({
      html: pin.html,
      className: pin.className,
      iconSize: pin.iconSize,
      iconAnchor: pin.iconAnchor,
      tooltipAnchor: pin.tooltipAnchor,
    });
  }, [building.category, isSelected]);

  const position: [number, number] = [building.coordinates.lat, building.coordinates.lng];

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: () => onSelect?.(building) }}
      title={`${building.name} (${building.code})`}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        {building.name}
      </Tooltip>
    </Marker>
  );
}