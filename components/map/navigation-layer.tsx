"use client";

import { useEffect, useState, useMemo } from "react";
import { Polyline, CircleMarker } from "react-leaflet";
import { db } from "@/lib/db";
import { findPath } from "@/lib/pathfinding/astar";
import type { MapNode, MapEdge, PathResult, TransportMode } from "@/lib/types/graph";
import type { LatLng } from "leaflet";
import { toast } from "sonner";

interface NavigationLayerProps {
  startPoint: LatLng | null;
  endPoint: LatLng | null;
  mode: TransportMode;
}

export function NavigationLayer({ startPoint, endPoint, mode }: NavigationLayerProps) {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);

  useEffect(() => {
    const loadGraph = async () => {
      if (!db) return;
      try {
        const [n, e] = await Promise.all([
          db.map_nodes.toArray(),
          db.map_edges.toArray(),
        ]);
        setNodes(n);
        setEdges(e);
      } catch (err) {
        console.error("Failed to load navigation graph", err);
      }
    };
    loadGraph();
  }, []);

  useEffect(() => {
    if (!startPoint || !endPoint || nodes.length === 0) {
      setPathResult(null);
      return;
    }

    const findNearestNode = (lat: number, lng: number): string | null => {
      let nearestId: string | null = null;
      let minDist = Infinity;

      for (const node of nodes) {
        const d = Math.sqrt(Math.pow(node.lat - lat, 2) + Math.pow(node.lng - lng, 2));
        if (d < minDist) {
          minDist = d;
          nearestId = node.id;
        }
      }
      return nearestId;
    };

    const startNodeId = findNearestNode(startPoint.lat, startPoint.lng);
    const endNodeId = findNearestNode(endPoint.lat, endPoint.lng);

    if (startNodeId && endNodeId) {
      const result = findPath(nodes, edges, startNodeId, endNodeId, mode);
      if (result) {
        setPathResult(result);
        if (result.path.length === 0) {
             toast.error("No path found");
        }
      } else {
        // Fallback: Straight line if pathfinding fails
        if (startPoint && endPoint) {
            setPathResult({
                path: [
                    { id: 'start', lat: startPoint.lat, lng: startPoint.lng, type: 'node' },
                    { id: 'end', lat: endPoint.lat, lng: endPoint.lng, type: 'node' }
                ],
                totalDistance: 0
            });
            toast.info("Pathfinding failed. Showing direct line.");
        } else {
            setPathResult(null);
            toast.error("Could not find a path");
        }
      }
    }
  }, [startPoint, endPoint, nodes, edges, mode]);

  if (!pathResult) return null;

  return (
    <>
      <Polyline
        positions={pathResult.path.map((n) => [n.lat, n.lng])}
        pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8, dashArray: '10, 10', dashOffset: '10' }}
      />
      <CircleMarker 
        center={[pathResult.path[0].lat, pathResult.path[0].lng]}
        radius={6}
        pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 1 }}
      />
      <CircleMarker 
        center={[pathResult.path[pathResult.path.length - 1].lat, pathResult.path[pathResult.path.length - 1].lng]}
        radius={6}
        pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 1 }}
      />
    </>
  );
}
