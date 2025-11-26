import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants/map";

type MapWrapperProps = {
  children?: React.ReactNode;
  className?: string;
};

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      {children}
    </MapContainer>
  );
}
