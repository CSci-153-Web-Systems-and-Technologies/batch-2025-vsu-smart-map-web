"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMapEvents, Marker, ZoomControl } from "react-leaflet";
import type { LatLng } from "leaflet";
import L from "leaflet";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_TILES, MAP_DEFAULT_CENTER } from "@/lib/constants/map";
import { useMapStyle } from "@/lib/context/map-style-context";
import type { MapNode, MapEdge } from "@/lib/types/graph";

// Fix Leaflet marker icons
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
  selectedEdgeId: string | null;
  edgeStartNodeId: string | null; // Add this prop
  onNodeAdd: (lat: number, lng: number) => void;
  onNodeSelect: (id: string) => void;
  onEdgeSelect: (id: string) => void;
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
  selectedEdgeId,
  edgeStartNodeId,
  onNodeAdd,
  onNodeSelect,
  onEdgeSelect,
  onNodeMove,
}: EditorMapContentProps) {
  const { resolvedTheme } = useTheme();
  const { mapStyle } = useMapStyle();

  const tileUrl = (() => {
    if (mapStyle === "satellite") return MAP_TILES.satelliteUrl;
    return resolvedTheme === "dark" && MAP_TILES.darkUrl ? MAP_TILES.darkUrl : MAP_TILES.url;
  })();

  const getEdgeColor = (edge: MapEdge) => {
    const access = edge.access || [];
    const hasWalk = access.includes('walking');
    const hasDrive = access.includes('driving');

    if (hasWalk && hasDrive) return '#f97316'; // Orange (Mixed)
    if (hasDrive) return '#3b82f6'; // Blue (Car/Bike only)
    return '#22c55e'; // Green (Walkway)
  };

  return (
    <MapContainer
      center={[MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng]}
      zoom={17}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl={false}
      zoomSnap={0}
      zoomDelta={0.5}
      wheelDebounceTime={40}
      bounceAtZoomLimits={false}
    >
      <TileLayer
        key={tileUrl}
        attribution={MAP_TILES.attribution}
        url={tileUrl}
        maxZoom={MAP_MAX_ZOOM}
        maxNativeZoom={MAP_TILES.maxNativeZoom ?? MAP_MAX_ZOOM}
      />
      <ZoomControl position="bottomleft" />
      
      <MapEvents mode={mode} onNodeAdd={onNodeAdd} />

      {edges.map((edge) => {
        const source = nodes.find((n) => n.id === edge.source_id);
        const target = nodes.find((n) => n.id === edge.target_id);
        if (!source || !target) return null;

        const isSelected = edge.id === selectedEdgeId;

        return (
          <Polyline
            key={edge.id}
            positions={[
              [source.lat, source.lng],
              [target.lat, target.lng],
            ]}
            pathOptions={{ 
              color: isSelected ? 'yellow' : getEdgeColor(edge), 
              weight: isSelected ? 6 : 4, 
              opacity: 0.8 
            }}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onEdgeSelect(edge.id);
              }
            }}
          />
        );
      })}

      {nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        const isStartNode = node.id === edgeStartNodeId;
        
        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={isSelected || isStartNode ? 8 : 5}
            pathOptions={{
              color: isSelected ? 'yellow' : (isStartNode ? 'cyan' : 'blue'),
              fillColor: isSelected ? 'yellow' : (isStartNode ? 'cyan' : 'blue'),
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
