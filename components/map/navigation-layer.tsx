"use client";

"use client";

import { useEffect, useState } from "react";
import { Polyline, CircleMarker } from "react-leaflet";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { findPath, getDistance, findNearestEdge } from "@/lib/pathfinding/astar";
import { getExternalPath } from "@/lib/pathfinding/external";
import type { MapNode, MapEdge, PathResult, TransportMode } from "@/lib/types/graph";
import type { LatLng } from "leaflet";
import { toast } from "sonner";

interface NavigationLayerProps {
  startPoint: LatLng | null;
  endPoint: LatLng | null;
  mode: TransportMode;
  nodes: MapNode[];
  edges: MapEdge[];
}

export function NavigationLayer({ startPoint, endPoint, mode, nodes, edges }: NavigationLayerProps) {
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Re-run whenever data or endpoints change
  }, []);

  useEffect(() => {
    if (!startPoint || !endPoint) {
      setPathResult(null);
      return;
    }

    const snapToGraph = (lat: number, lng: number): string | null => {
      if (!nodes || nodes.length === 0 || !edges || edges.length === 0) return null;

      const { nearestEdge } = findNearestEdge(lat, lng, nodes, edges, mode);
      
      if (nearestEdge) {
        const source = nodes.find((n: MapNode) => n.id === nearestEdge.source_id);
        const target = nodes.find((n: MapNode) => n.id === nearestEdge.target_id);
        
        if (source && target) {
          const dSource = getDistance(lat, lng, source.lat, source.lng);
          const dTarget = getDistance(lat, lng, target.lat, target.lng);
          return dSource < dTarget ? source.id : target.id;
        }
      }

      let nearestId: string | null = null;
      let minDist = Infinity;

      const navigableNodeIds = new Set<string>();
      for (const edge of edges) {
        const hasAccess = (edge.access && edge.access.length > 0)
          ? edge.access.includes(mode)
          : (mode === 'walking' || edge.type === 'road');

        if (hasAccess) {
          navigableNodeIds.add(edge.source_id);
          navigableNodeIds.add(edge.target_id);
        }
      }

      for (const node of nodes) {
        if (!navigableNodeIds.has(node.id)) continue;
        const d = getDistance(node.lat, node.lng, lat, lng);
        if (d < minDist) {
          minDist = d;
          nearestId = node.id;
        }
      }

      if (!nearestId) {
        for (const node of nodes) {
          const d = getDistance(node.lat, node.lng, lat, lng);
          if (d < minDist) {
            minDist = d;
            nearestId = node.id;
          }
        }
      }

      return nearestId;
    };

    const runPathfinding = async () => {
      setIsLoading(true);
      setPathResult(null);
      toast.loading("Loading route...");

      // 1. DATABASE CHECK: Is the DB open?
      if (!db.isOpen()) {
         try {
            await db.open();
         } catch (e) {
            console.error("NavigationLayer: DB Failed to open", e);
            toast.error("Failed to open database for routing.");
            setIsLoading(false);
            return;
         }
      }

      // 2. DATA CHECK: Wait for nodes to load if they are empty
      // If we proceed with empty nodes, we might trigger a premature fallback.
      // useLiveQuery will re-trigger this effect when data arrives.
      if (!nodes || nodes.length === 0 || !edges || edges.length === 0) {
         console.log("NavigationLayer: Waiting for graph data...", { nodes: nodes?.length, edges: edges?.length });
         setIsLoading(false);
         return; 
      }

      try {
        console.log("NavigationLayer: Running pathfinding", { startPoint, endPoint, nodesCount: nodes?.length });
        const startNodeId = snapToGraph(startPoint.lat, startPoint.lng);
        const endNodeId = snapToGraph(endPoint.lat, endPoint.lng);
        console.log("NavigationLayer: Snapped nodes", { startNodeId, endNodeId });

        if (startNodeId && endNodeId && nodes && nodes.length > 0 && edges && edges.length > 0) {
          const result = findPath(nodes, edges, startNodeId, endNodeId, mode);
          if (result && result.path.length > 0) {
            
            // VISUAL FIX: Append User Start and Destination End to the path to remove gaps
            const userStartNode = { id: 'user-pos', lat: startPoint.lat, lng: startPoint.lng, type: 'node' } as MapNode;
            const destEndNode = { id: 'dest-pos', lat: endPoint.lat, lng: endPoint.lng, type: 'node' } as MapNode;

            const newPath = [userStartNode, ...result.path, destEndNode];
            result.path = newPath;

            // Recalculate distance with the new segments
            const firstDist = getDistance(startPoint.lat, startPoint.lng, result.path[1].lat, result.path[1].lng);
            const lastDist = getDistance(result.path[result.path.length - 2].lat, result.path[result.path.length - 2].lng, endPoint.lat, endPoint.lng);
            result.totalDistance += (firstDist + lastDist);
            
            console.log("NavigationLayer: Internal path found", { nodes: result.path.length });
            setPathResult(result);
            toast.dismiss();
            toast.success("Route found!");
            setIsLoading(false);
            return;
          }
        }

        // Only fallback if we actually have points but no internal path
        console.log("NavigationLayer: Falling back to external routing...");
        const externalResult = await getExternalPath(
          { lat: startPoint.lat, lng: startPoint.lng },
          { lat: endPoint.lat, lng: endPoint.lng },
          mode
        );

        if (externalResult && externalResult.path.length > 0) {
          console.log("NavigationLayer: External path found", { nodes: externalResult.path.length });
          setPathResult(externalResult);
          toast.dismiss();
          toast.success("Route found (external)!");
        } else {
          console.warn("NavigationLayer: External routing failed, showing straight line");
          setPathResult({
            path: [
              { id: 'start', lat: startPoint.lat, lng: startPoint.lng, type: 'node' } as MapNode,
              { id: 'end', lat: endPoint.lat, lng: endPoint.lng, type: 'node' } as MapNode
            ],
            totalDistance: getDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng)
          });
          toast.dismiss();
          toast.error("No route found.");
        }
      } catch (err) {
        console.error("NavigationLayer: Process error", err);
        toast.dismiss();
        toast.error("An error occurred during routing.");
      } finally {
        setIsLoading(false);
      }
    };

    runPathfinding();
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
