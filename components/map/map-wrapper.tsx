import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_MIN_ZOOM, MAP_MAX_ZOOM, MAP_TILES } from "@/lib/constants/map";
import { useApp } from "@/lib/context/app-context";
import type { LatLngBoundsExpression } from "leaflet";

type MapWrapperProps = {
  children?: React.ReactNode;
  className?: string;
  bounds?: LatLngBoundsExpression | null;
};

// Component to handle bounds changes
function MapBoundsHandler({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }
  }, [bounds, map]);
  
  return null;
}

export function MapWrapper({ children, className, bounds }: MapWrapperProps) {
  const { resolvedTheme } = useTheme();
  const { mapStyle } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tileUrl = (() => {
    if (!mounted) return MAP_TILES.url;
    if (mapStyle === "satellite") return MAP_TILES.satelliteUrl;
    return resolvedTheme === "dark" && MAP_TILES.darkUrl ? MAP_TILES.darkUrl : MAP_TILES.url;
  })();

  return (
    <div className="map-wrapper h-full w-full relative">
      <style>{`
        @media (max-width: 768px) {
          .map-wrapper .leaflet-bottom.leaflet-left {
            margin-bottom: 5rem;
          }
        }
      `}</style>
      <MapContainer
        center={[MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng]}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        scrollWheelZoom
        zoomControl={false}
        zoomSnap={0}
        zoomDelta={0.5}
        wheelDebounceTime={40}
        bounceAtZoomLimits={false}
        className={className ?? "h-full w-full"}
      >
        <TileLayer
          key={tileUrl}
          attribution={MAP_TILES.attribution}
          url={tileUrl}
          maxZoom={MAP_MAX_ZOOM}
          maxNativeZoom={MAP_TILES.maxNativeZoom ?? MAP_MAX_ZOOM}
        />
        <ZoomControl position="bottomleft" />
        <MapBoundsHandler bounds={bounds} />
        {children}
      </MapContainer>
    </div>
  );
}
