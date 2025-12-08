"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { useTheme } from "next-themes";
import type { LatLng } from "@/lib/types/common";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_TILES } from "@/lib/constants/map";
import { useMapStyle } from "@/lib/context/map-style-context";

interface LocationPreviewMapProps {
  coordinates: LatLng;
}

export function LocationPreviewMap({ coordinates }: LocationPreviewMapProps) {
  const { resolvedTheme } = useTheme();
  const { mapStyle } = useMapStyle();

  const tileUrl = (() => {
    if (mapStyle === "satellite") return MAP_TILES.satelliteUrl;
    return resolvedTheme === "dark" && MAP_TILES.darkUrl ? MAP_TILES.darkUrl : MAP_TILES.url;
  })();

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={17}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={true}
      >
        <TileLayer
          key={tileUrl}
          attribution={MAP_TILES.attribution}
          url={tileUrl}
          maxZoom={MAP_MAX_ZOOM}
          maxNativeZoom={MAP_TILES.maxNativeZoom ?? MAP_MAX_ZOOM}
        />
        <CircleMarker
          center={[coordinates.lat, coordinates.lng]}
          radius={12}
          pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.6, weight: 3 }}
        />
      </MapContainer>
    </div>
  );
}
