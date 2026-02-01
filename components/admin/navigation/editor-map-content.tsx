"use client";

import "leaflet/dist/leaflet.css";

import { useTheme } from "next-themes";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMapEvents, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_TILES, MAP_DEFAULT_CENTER } from "@/lib/constants/map";
import { useMapStyle } from "@/lib/context/map-style-context";
import type { MapNode, MapEdge } from "@/lib/types/graph";

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
}: EditorMapContentProps) {
  const { resolvedTheme } = useTheme();
  const { mapStyle } = useMapStyle();

  const tileUrl = (() => {
    if (mapStyle === "satellite") return MAP_TILES.satelliteUrl;
    return resolvedTheme === "dark" && MAP_TILES.darkUrl ? MAP_TILES.darkUrl : MAP_TILES.url;
  })();

  const getEdgeColor = (edge: MapEdge) => {
    if (edge.is_closed) return '#ef4444';
    
    const access = edge.access || [];
    const hasWalk = access.includes('walking');
    const hasDrive = access.includes('driving');

    if (hasWalk && hasDrive) return '#f97316';
    if (hasDrive) return '#3b82f6';
    return '#22c55e';
  };

  const getEdgeDashArray = (edge: MapEdge) => {
    if (edge.is_closed) return '5, 10';
    if (!edge.bidirectional) return '10, 5';
    return undefined;
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
              opacity: edge.is_closed ? 0.5 : 0.8,
              dashArray: isSelected ? undefined : getEdgeDashArray(edge),
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
            }}
          />
        );
      })}
    </MapContainer>
  );
}
