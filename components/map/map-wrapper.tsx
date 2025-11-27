import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_TILES } from "@/lib/constants/map";

type MapWrapperProps = {
  children?: React.ReactNode;
  className?: string;
};

export function MapWrapper({ children, className }: MapWrapperProps) {
  useEffect(() => {
    // Leaflet reads these from the global L; this ensures CSS is loaded once.
  }, []);

  return (
    <MapContainer
      center={[MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng]}
      zoom={MAP_DEFAULT_ZOOM}
      scrollWheelZoom
      className={className ?? "h-full w-full"}
    >
      <TileLayer attribution={MAP_TILES.attribution} url={MAP_TILES.url} />
      {children}
    </MapContainer>
  );
}
