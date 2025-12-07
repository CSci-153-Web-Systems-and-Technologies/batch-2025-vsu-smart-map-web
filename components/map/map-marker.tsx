"use client";

import { useMemo, useEffect, useRef } from "react";
import { Marker, Tooltip, Popup } from "react-leaflet";
import { divIcon, type DivIcon, type Marker as LeafletMarker } from "leaflet";
import { getPinAssetForCategory } from "@/lib/map/pins";
import type { MapItem } from "@/lib/types/map";
import { MapPopupCard } from "./map-popup-card";
import { useApp } from "@/lib/context/app-context";

type MapMarkerProps = {
  item: MapItem;
  isSelected?: boolean;
  onSelect?: (item: MapItem) => void;
};

export function MapMarker({ item, isSelected = false, onSelect }: MapMarkerProps) {
  const { setActiveTab, selectFacility } = useApp();

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
  const markerRef = useRef<LeafletMarker>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (isSelected) {
      marker.openPopup();
    } else {
      marker.closePopup();
    }
  }, [isSelected]);

  const handleViewDetails = () => {
    setActiveTab("directory");
  };

  return (
    <Marker
      position={position}
      ref={markerRef}
      icon={icon}
      eventHandlers={{
        click: () => {
          onSelect?.(item);
        },
        popupclose: () => {
        }
      }}
      title={item.code ? `${item.name} (${item.code})` : item.name}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        {item.name}
      </Tooltip>
      <Popup offset={[0, -20]} className="map-popup-card">
        <MapPopupCard
          facility={item as any}
          onViewDetails={handleViewDetails}
        />
      </Popup>
    </Marker>
  );
}

