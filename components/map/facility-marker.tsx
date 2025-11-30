"use client";

import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { FacilityMarkerPayload } from "@/lib/types/facility";
import { getPinAssetForCategory } from "@/lib/map/pins";
import { getCategoryLabel } from "@/lib/constants/facilities";

interface FacilityMarkerProps {
  facility: FacilityMarkerPayload;
  selected?: boolean;
  onClick?: (facility: FacilityMarkerPayload) => void;
}

export function FacilityMarker({
  facility,
  selected = false,
  onClick,
}: FacilityMarkerProps) {
  const pinAsset = getPinAssetForCategory(facility.category, { selected });

  const icon = L.divIcon({
    html: pinAsset.html,
    className: pinAsset.className,
    iconSize: pinAsset.iconSize,
    iconAnchor: pinAsset.iconAnchor,
    tooltipAnchor: pinAsset.tooltipAnchor,
  });

  const handleClick = () => {
    onClick?.(facility);
  };

  return (
    <Marker
      position={[facility.coordinates.lat, facility.coordinates.lng]}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    >
      <Tooltip direction="top" offset={[0, -10]}>
        <div className="text-sm font-medium">{facility.name}</div>
        <div className="text-xs text-muted-foreground">
          {getCategoryLabel(facility.category)}
        </div>
      </Tooltip>
    </Marker>
  );
}
