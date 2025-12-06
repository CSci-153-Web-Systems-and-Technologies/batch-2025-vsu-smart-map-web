import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer } from "react-leaflet";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_MIN_ZOOM, MAP_MAX_ZOOM, MAP_TILES } from "@/lib/constants/map";

type MapWrapperProps = {
  children?: React.ReactNode;
  className?: string;
};

export function MapWrapper({ children, className }: MapWrapperProps) {

  return (
    <div className="map-wrapper h-full w-full">
      <MapContainer
        center={[MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng]}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        scrollWheelZoom
        className={className ?? "h-full w-full"}
      >
        <TileLayer
          attribution={MAP_TILES.attribution}
          url={MAP_TILES.url}
          maxZoom={MAP_MAX_ZOOM}
          maxNativeZoom={MAP_TILES.maxNativeZoom ?? MAP_MAX_ZOOM}
        />
        {children}
      </MapContainer>
    </div>
  );
}
