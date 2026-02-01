import type { MapNode, MapEdge, PathResult, TransportMode } from "@/lib/types/graph";

// Access rules: Which modes can use which edge types by default?
const DEFAULT_ACCESS: Record<string, TransportMode[]> = {
  road: ['walking', 'cycling', 'driving'], // Roads usually allow all, unless restricted
  walkway: ['walking'],
};

function canTraverse(edge: MapEdge, mode: TransportMode): boolean {
  if (edge.access && edge.access.length > 0) {
    return edge.access.includes(mode);
  }
  
  const allowed = DEFAULT_ACCESS[edge.type] || ['walking'];
  return allowed.includes(mode);
}

export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export function getNearestPointOnSegment(p: {lat: number, lng: number}, a: {lat: number, lng: number}, b: {lat: number, lng: number}) {
  const atob = { x: b.lng - a.lng, y: b.lat - a.lat };
  const atop = { x: p.lng - a.lng, y: p.lat - a.lat };
  const len = atob.x * atob.x + atob.y * atob.y;
  const dot = atop.x * atob.x + atop.y * atob.y;
  const t = Math.min(1, Math.max(0, len === 0 ? 0 : dot / len));
  
  return {
      lat: a.lat + atob.y * t,
      lng: a.lng + atob.x * t
  };
}

export function findNearestEdge(
  lat: number, 
  lng: number, 
  nodes: MapNode[], 
  edges: MapEdge[],
  mode: TransportMode = 'walking'
) {
  let minDistance = Infinity;
  let nearestPoint = { lat, lng };
  let nearestEdge: MapEdge | null = null;

  for (const edge of edges) {
    if (!canTraverse(edge, mode)) continue;
    const source = nodes.find(n => n.id === edge.source_id);
    const target = nodes.find(n => n.id === edge.target_id);
    if (!source || !target) continue;

    const pointOnEdge = getNearestPointOnSegment({ lat, lng }, source, target);
    const dist = getDistance(lat, lng, pointOnEdge.lat, pointOnEdge.lng);

    if (dist < minDistance) {
      minDistance = dist;
      nearestPoint = pointOnEdge;
      nearestEdge = edge;
    }
  }

  return { nearestPoint, nearestEdge, distance: minDistance };
}

export function findPath(
  nodes: MapNode[],
  edges: MapEdge[],
  startNodeId: string,
  endNodeId: string,
  mode: TransportMode = 'walking'
): PathResult | null {
  if (startNodeId === endNodeId) {
    const node = nodes.find(n => n.id === startNodeId);
    return node ? { path: [node], totalDistance: 0 } : null;
  }

  const startNode = nodes.find((n) => n.id === startNodeId);
  const endNode = nodes.find((n) => n.id === endNodeId);

  if (!startNode || !endNode) return null;

  const openSet = new Set<string>([startNodeId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, getDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng));

  while (openSet.size > 0) {
    let currentId: string | null = null;
    let lowestFScore = Infinity;

    for (const id of openSet) {
      const score = fScore.get(id) ?? Infinity;
      if (score < lowestFScore) {
        lowestFScore = score;
        currentId = id;
      }
    }

    if (currentId === endNodeId) {
      return reconstructPath(cameFrom, currentId!, nodes);
    }

    if (!currentId) break;

    openSet.delete(currentId);
    const currentNode = nodes.find(n => n.id === currentId);
    if (!currentNode) continue;

    const currentG = gScore.get(currentId) ?? Infinity;

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
      
      const tentativeGScore = currentG + edgeWeight;

      if (tentativeGScore < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeGScore);
        const h = getDistance(neighbor.lat, neighbor.lng, endNode.lat, endNode.lng);
        fScore.set(neighborId, tentativeGScore + h);
        openSet.add(neighborId);
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
