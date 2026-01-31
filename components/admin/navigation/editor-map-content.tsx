"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMapEvents, Marker } from "react-leaflet";
import type { LatLng } from "leaflet";
import L from "leaflet";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_TILES, MAP_DEFAULT_CENTER } from "@/lib/constants/map";
import { useMapStyle } from "@/lib/context/map-style-context";
import type { MapNode, MapEdge } from "@/lib/types/graph";

const icon = L.icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface EditorMapContentProps {
  nodes: MapNode[];
  edges: MapEdge[];
  mode: 'select' | 'add_node' | 'add_edge';
  selectedNodeId: string | null;
  onNodeAdd: (lat: number, lng: number) => void;
  onNodeSelect: (id: string) => void;
  onNodeMove: (id: string, lat: number, lng: number) => void;
}

function MapEvents({ mode, onNodeAdd }: { mode: string; onNodeAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (mode === 'add_node') {
        onNodeAdd(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function EditorMapContent({
  nodes,
  edges,
  mode,
  selectedNodeId,
  onNodeAdd,
  onNodeSelect,
  onNodeMove,
}: EditorMapContentProps) {
  const { resolvedTheme } = useTheme();
  const { mapStyle } = useMapStyle();

  const tileUrl = (() => {
    if (mapStyle === "satellite") return MAP_TILES.satelliteUrl;
    return resolvedTheme === "dark" && MAP_TILES.darkUrl ? MAP_TILES.darkUrl : MAP_TILES.url;
  })();

  const handleNodeDrag = useCallback((id: string, e: L.LeafletEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    onNodeMove(id, position.lat, position.lng);
  }, [onNodeMove]);

  return (
    <MapContainer
      center={[MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng]}
      zoom={17}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        key={tileUrl}
        attribution={MAP_TILES.attribution}
        url={tileUrl}
        maxZoom={MAP_MAX_ZOOM}
        maxNativeZoom={MAP_TILES.maxNativeZoom ?? MAP_MAX_ZOOM}
      />
      
      <MapEvents mode={mode} onNodeAdd={onNodeAdd} />

      {edges.map((edge) => {
        const source = nodes.find((n) => n.id === edge.source_id);
        const target = nodes.find((n) => n.id === edge.target_id);
        if (!source || !target) return null;

        return (
          <Polyline
            key={edge.id}
            positions={[
              [source.lat, source.lng],
              [target.lat, target.lng],
            ]}
            pathOptions={{ color: 'red', weight: 3, opacity: 0.7 }}
          />
        );
      })}

      {nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={isSelected ? 8 : 5}
            pathOptions={{
              color: isSelected ? 'yellow' : 'blue',
              fillColor: isSelected ? 'yellow' : 'blue',
              fillOpacity: 0.8,
            }}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onNodeSelect(node.id);
              },
              mousedown: (e) => {
                 
              }
            }}
          />
        );
      })}
    </MapContainer>
  );
}
