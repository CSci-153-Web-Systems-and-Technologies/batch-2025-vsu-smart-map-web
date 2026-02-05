"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { Marker, Tooltip, Popup, useMapEvents } from "react-leaflet";
import { divIcon, type DivIcon, type Marker as LeafletMarker } from "leaflet";
import { getPinAssetForCategory } from "@/lib/map/pins";
import type { MapItem } from "@/lib/types/map";
import type { Facility } from "@/lib/types/facility";
import { MapPopupCard } from "./map-popup-card";
import { useApp } from "@/lib/context/app-context";

type MapMarkerProps = {
  item: MapItem;
  isSelected?: boolean;
  onSelect?: (item: MapItem) => void;
  onDirections?: (item: MapItem) => void;
};

export function MapMarker({ item, isSelected = false, onSelect, onDirections }: MapMarkerProps) {
  const { setFacilitySheetOpen } = useApp();
  const [zoom, setZoom] = useState(16);

  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });

  // Initialize zoom
  useEffect(() => {
    setZoom(map.getZoom());
  }, [map]);

  const isMinimized = zoom < 16;
  // Label shows only at high zoom and ONLY if NOT selected (avoids redundancy)
  const showSideLabel = zoom >= 18.5 && !isSelected;

  const icon: DivIcon = useMemo(() => {
    const category = item.category ?? "academic";
    const pin = getPinAssetForCategory(category, {
      selected: isSelected,
      minimized: isMinimized,
      label: showSideLabel ? item.name : undefined
    });
    return divIcon({
      html: pin.html,
      className: pin.className,
      iconSize: pin.iconSize,
      iconAnchor: pin.iconAnchor,
      tooltipAnchor: pin.tooltipAnchor,
    });
  }, [item.category, isSelected, isMinimized, showSideLabel, item.name]);

  const position: [number, number] = [item.coordinates.lat, item.coordinates.lng];
  const markerRef = useRef<LeafletMarker>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (isSelected) {
      // Unbind tooltip before opening popup to prevent null reference errors
      // when Leaflet tries to access the tooltip during state transitions
      if (marker.getTooltip()) {
        marker.unbindTooltip();
      }
      // Small timeout to ensure the marker is ready in Leaflet's engine
      const timer = setTimeout(() => {
        marker.openPopup();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      marker.closePopup();
    }
  }, [isSelected]);

  const handleViewDetails = () => {
    setFacilitySheetOpen(true);
  };

  return (
    <Marker
      key={`${item.id}-${isMinimized}`}
      position={position}
      ref={markerRef}
      icon={icon}
      eventHandlers={{
        click: () => {
          onSelect?.(item);
        },
      }}
      title={item.code ? `${item.name} (${item.code})` : item.name}
    >
      {!showSideLabel && !isSelected && (
        <Tooltip direction="top" offset={[0, -10]} opacity={1}>
          {item.name}
        </Tooltip>
      )}
      <Popup offset={[0, -20]} className="map-popup-card" autoPan={false}>
        <MapPopupCard
          facility={item as unknown as Facility}
          onViewDetails={handleViewDetails}
          onDirections={() => onDirections?.(item)}
        />
      </Popup>
    </Marker>
  );
}
