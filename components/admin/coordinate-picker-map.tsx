"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, CircleMarker } from "react-leaflet";
import type { LatLng } from "@/lib/types/common";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_TILES } from "@/lib/constants/map";

interface CoordinatePickerMapProps {
  value: LatLng;
  onChange: (coords: LatLng) => void;
}

function ClickCapture({ onChange }: { onChange: (coords: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function MapCenterUpdater({ value }: { value: LatLng }) {
  const map = useMap();

  useEffect(() => {
    map.setView([value.lat, value.lng]);
  }, [map, value.lat, value.lng]);

  return null;
}

export function CoordinatePickerMap({ value, onChange }: CoordinatePickerMapProps) {
  return (
    <MapContainer
      center={[value.lat, value.lng]}
      zoom={17}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution={MAP_TILES.attribution}
        url={MAP_TILES.url}
        maxZoom={MAP_MAX_ZOOM}
        maxNativeZoom={MAP_TILES.maxNativeZoom ?? MAP_MAX_ZOOM}
      />
      <MapCenterUpdater value={value} />
      <ClickCapture onChange={onChange} />
      <CircleMarker
        center={[value.lat, value.lng]}
        radius={10}
        pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.5 }}
      />
    </MapContainer>
  );
}
