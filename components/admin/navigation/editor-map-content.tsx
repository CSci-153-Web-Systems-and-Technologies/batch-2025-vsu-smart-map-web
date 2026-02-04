"use client";

import "leaflet/dist/leaflet.css";

import { useTheme } from "next-themes";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMapEvents, ZoomControl, Marker } from "react-leaflet";
import L from "leaflet";
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_TILES, MAP_DEFAULT_CENTER } from "@/lib/constants/map";
import { useMapStyle } from "@/lib/context/map-style-context";
import { isEdgeClosed } from "@/lib/pathfinding/astar";
import type { MapNode, MapEdge } from "@/lib/types/graph";

interface EditorMapContentProps {
  nodes: MapNode[];
  edges: MapEdge[];
  mode: 'select' | 'add_node' | 'add_edge' | 'mixed';
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  edgeStartNodeId: string | null;
  onNodeAdd: (lat: number, lng: number) => void;
  onNodeSelect: (id: string, multi: boolean) => void;
  onEdgeSelect: (id: string, multi: boolean) => void;
  onNodeMove: (id: string, lat: number, lng: number) => void;
}

function MapEvents({ mode, onNodeAdd }: { mode: string; onNodeAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (mode === 'add_node' || mode === 'mixed') {
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
  selectedNodeIds,
  selectedEdgeIds,
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
    if (isEdgeClosed(edge)) return '#ef4444';
    
    const access = edge.access || [];
    const hasWalk = access.includes('walking');
    const hasDrive = access.includes('driving');

    if (hasWalk && hasDrive) return '#f97316';
    if (hasDrive) return '#3b82f6';
    return '#22c55e';
  };

  const getEdgeDashArray = (edge: MapEdge) => {
    if (isEdgeClosed(edge)) return '5, 10';
    if (!edge.bidirectional) return '10, 5';
    return undefined;
  };

  const groupedEdges = new Map<string, MapEdge[]>();
  edges.forEach(edge => {
    const key = [edge.source_id, edge.target_id].sort().join('-');
    if (!groupedEdges.has(key)) {
      groupedEdges.set(key, []);
    }
    groupedEdges.get(key)!.push(edge);
  });

  const getNodeColor = (node: MapNode, isSelected: boolean, isChainStart: boolean) => {
    if (isSelected) return 'yellow';
    if (isChainStart) return 'cyan';
    
    switch (node.type) {
      case 'path_start': return '#22c55e';
      case 'path_middle': return '#eab308';
      case 'path_end': return '#ef4444';
      case 'building_entry': return '#a855f7';
      default: return '#3b82f6';
    }
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

      {Array.from(groupedEdges.values()).flatMap((group) => {
        return group.map((edge, index) => {
          const source = nodes.find((n) => n.id === edge.source_id);
          const target = nodes.find((n) => n.id === edge.target_id);
          if (!source || !target) return null;

          const isSelected = selectedEdgeIds.has(edge.id);
          
          let lat1 = source.lat;
          let lng1 = source.lng;
          let lat2 = target.lat;
          let lng2 = target.lng;

          if (group.length > 1) {
            const offsetStep = 0.00003; 
            const offsetIndex = index - (group.length - 1) / 2;
            
            const dx = lng2 - lng1;
            const dy = lat2 - lat1;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            if (len > 0) {
                const px = -dy / len * offsetStep * offsetIndex;
                const py = dx / len * offsetStep * offsetIndex;
                
                lat1 += py;
                lng1 += px;
                lat2 += py;
                lng2 += px;
            }
          }

          const showArrow = !edge.bidirectional;
          const arrowIcon = showArrow ? (() => {
              const angle = Math.atan2(lat2 - lat1, lng2 - lng1) * 180 / Math.PI;
              const color = getEdgeColor(edge);
              // CSS rotation is clockwise. 0deg is East (right).
              // atan2 gives counter-clockwise from East.
              // So we need -angle.
              return L.divIcon({
                  className: 'bg-transparent border-none',
                  html: `<div style="transform: rotate(${-angle}deg); width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 12px solid ${isSelected ? 'yellow' : color};"></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6], // Center of the 12x12 box? No, center of rotation. 
                  // If arrow is border-left, the tip is at right. The 'center' of the triangle visually is roughly 1/3 from left.
                  // But let's just center the div.
              });
          })() : null;

          const midLat = (lat1 + lat2) / 2;
          const midLng = (lng1 + lng2) / 2;

          return (
            <>
            <Polyline
              key={edge.id}
              positions={[
                [lat1, lng1],
                [lat2, lng2],
              ]}
              pathOptions={{ 
                color: isSelected ? 'yellow' : getEdgeColor(edge), 
                weight: isSelected ? 6 : 4, 
                opacity: isEdgeClosed(edge) ? 0.5 : 0.8,
                dashArray: isSelected ? undefined : getEdgeDashArray(edge),
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  const isMulti = e.originalEvent.metaKey || e.originalEvent.ctrlKey || e.originalEvent.shiftKey;
                  onEdgeSelect(edge.id, isMulti);
                }
              }}
            />
            {showArrow && (
                <Marker 
                    position={[midLat, midLng]}
                    icon={arrowIcon!}
                    eventHandlers={{
                        click: (e) => {
                            L.DomEvent.stopPropagation(e);
                            const isMulti = e.originalEvent.metaKey || e.originalEvent.ctrlKey || e.originalEvent.shiftKey;
                            onEdgeSelect(edge.id, isMulti);
                        }
                    }}
                />
            )}
            </>
          );
        });
      })}

      {nodes.map((node) => {
        const isSelected = selectedNodeIds.has(node.id);
        const isStartNode = node.id === edgeStartNodeId;
        const color = getNodeColor(node, isSelected, isStartNode);
        const radius = isSelected || isStartNode ? 8 : 5;

        const icon = L.divIcon({
          className: 'custom-node-icon',
          html: `<div style="background-color: ${color}; width: ${radius*2}px; height: ${radius*2}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [radius*2, radius*2],
          iconAnchor: [radius, radius],
        });
        
        return (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={icon}
            draggable={mode === 'select'}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                const isMulti = e.originalEvent.metaKey || e.originalEvent.ctrlKey || e.originalEvent.shiftKey;
                onNodeSelect(node.id, isMulti);
              },
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                onNodeMove(node.id, position.lat, position.lng);
              }
            }}
          />
        );
      })}
    </MapContainer>
  );
}