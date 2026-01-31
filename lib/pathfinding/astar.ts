import type { MapNode, MapEdge, PathResult, TransportMode } from "@/lib/types/graph";

// Default speeds (meters per second) - rough estimates for heuristics if needed later
const SPEEDS = {
  walking: 1.4, // ~5 km/h
  cycling: 4.5, // ~16 km/h
  driving: 8.3, // ~30 km/h (campus speed limit)
};

// Access rules: Which modes can use which edge types by default?
const DEFAULT_ACCESS: Record<string, TransportMode[]> = {
  road: ['walking', 'cycling', 'driving'], // Roads usually allow all, unless restricted
  walkway: ['walking'],
};

function canTraverse(edge: MapEdge, mode: TransportMode): boolean {
  // If edge has explicit access list, use it
  if (edge.access && edge.access.length > 0) {
    return edge.access.includes(mode);
  }
  
  // Otherwise fall back to default based on type
  const allowed = DEFAULT_ACCESS[edge.type] || ['walking'];
  return allowed.includes(mode);
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function findPath(
  nodes: MapNode[],
  edges: MapEdge[],
  startNodeId: string,
  endNodeId: string,
  mode: TransportMode = 'walking'
): PathResult | null {
  const startNode = nodes.find((n) => n.id === startNodeId);
  const endNode = nodes.find((n) => n.id === endNodeId);

  if (!startNode || !endNode) return null;

  const openSet = new Set<string>([startNodeId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  nodes.forEach((node) => {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  });

  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, getDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng));

  while (openSet.size > 0) {
    let currentId: string | null = null;
    let lowestFScore = Infinity;

    openSet.forEach((id) => {
      const score = fScore.get(id) ?? Infinity;
      if (score < lowestFScore) {
        lowestFScore = score;
        currentId = id;
      }
    });

    if (currentId === endNodeId) {
      return reconstructPath(cameFrom, currentId!, nodes);
    }

    if (!currentId) break;

    openSet.delete(currentId);
    const currentNode = nodes.find(n => n.id === currentId)!;

    const neighbors = edges.filter(
      (e) => (e.source_id === currentId || (e.bidirectional && e.target_id === currentId)) && canTraverse(e, mode)
    );

    for (const edge of neighbors) {
      const neighborId = edge.source_id === currentId ? edge.target_id : edge.source_id;
      const neighbor = nodes.find((n) => n.id === neighborId);
      if (!neighbor) continue;

      const edgeWeight = edge.weight > 0 
        ? edge.weight 
        : getDistance(currentNode.lat, currentNode.lng, neighbor.lat, neighbor.lng);
      
      const tentativeGScore = (gScore.get(currentId) ?? Infinity) + edgeWeight;

      if (tentativeGScore < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeGScore);
        fScore.set(
          neighborId,
          tentativeGScore + getDistance(neighbor.lat, neighbor.lng, endNode.lat, endNode.lng)
        );
        if (!openSet.has(neighborId)) {
          openSet.add(neighborId);
        }
      }
    }
  }

  return null;
}

function reconstructPath(cameFrom: Map<string, string>, currentId: string, nodes: MapNode[]): PathResult {
  const totalPath: string[] = [currentId];
  while (cameFrom.has(currentId)) {
    currentId = cameFrom.get(currentId)!;
    totalPath.unshift(currentId);
  }

  const pathNodes = totalPath
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is MapNode => n !== undefined);

  let totalDistance = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) {
    totalDistance += getDistance(
      pathNodes[i].lat,
      pathNodes[i].lng,
      pathNodes[i + 1].lat,
      pathNodes[i + 1].lng
    );
  }

  return { path: pathNodes, totalDistance };
}
