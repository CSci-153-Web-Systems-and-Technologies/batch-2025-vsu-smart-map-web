import type { MapNode, MapEdge, PathResult, TransportMode } from "@/lib/types/graph";

const SPEEDS = {
  walking: 80,
  cycling: 250,
  driving: 500,
};

const DEFAULT_ACCESS: Record<string, TransportMode[]> = {
  road: ['walking', 'cycling', 'driving'],
  walkway: ['walking'],
};

function isTimeInRange(now: Date, start: string, end: string): boolean {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  const currentH = now.getHours();
  const currentM = now.getMinutes();
  const currentMinutes = currentH * 60 + currentM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight range (e.g. 22:00 to 06:00)
    // Open if after start OR before end
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

function isEdgeClosed(edge: MapEdge): boolean {
  const now = new Date();

  // 1. Force Close (Permanent Toggle)
  if (edge.closed_until_toggled) return true;

  // 2. Date Range (Temporary Closure)
  // Logic: If a date range is specified, it is CLOSED within that range.
  if (edge.closed_from || edge.closed_until) {
    const from = edge.closed_from ? new Date(edge.closed_from) : null;
    const until = edge.closed_until ? new Date(edge.closed_until) : null;

    let isInsideRange = true;
    if (from && now < from) isInsideRange = false;
    if (until && now > until) isInsideRange = false;

    if (isInsideRange) return true;
  }

  // 3. Recurring Schedule
  // Logic: Defined times are interpreted as allowed (open) times.
  // Everything else is considered closed.
  
  const hasRecurringSchedule = 
    (edge.closure_recurring_days && edge.closure_recurring_days.length > 0) ||
    (edge.closure_daily_schedule && Object.keys(edge.closure_daily_schedule).length > 0) ||
    (edge.closure_recurring_start && edge.closure_recurring_end);

  if (hasRecurringSchedule) {
    const day = now.getDay();
    
    // Check if today is an allowed day.
    // The field 'closure_recurring_days' is used to store the list of allowed days.
    if (edge.closure_recurring_days && edge.closure_recurring_days.length > 0) {
      if (!edge.closure_recurring_days.includes(day)) {
        return true; // Not in allowed days -> Closed
      }
    }

    // Today is allowed (or no specific days set). Check time restrictions.
    
    let start = edge.closure_recurring_start;
    let end = edge.closure_recurring_end;

    // Specific daily schedule overrides global recurring time
    if (edge.closure_daily_schedule?.[day]) {
      start = edge.closure_daily_schedule[day].start;
      end = edge.closure_daily_schedule[day].end;
    }

    if (start && end) {
      // If time range is defined, we must be INSIDE it to be Open.
      if (!isTimeInRange(now, start, end)) {
        return true; // Outside allowed hours -> Closed
      }
    }
  }

  // If no Force Close, no Date Range Closure active, and passed Schedule checks (or no schedule), it's Open.
  return false;
}

function canTraverse(edge: MapEdge, mode: TransportMode): boolean {
  if (isEdgeClosed(edge)) return false;

  if (edge.access && edge.access.length > 0) {
    return edge.access.includes(mode);
  }
  
  const allowed = DEFAULT_ACCESS[edge.type] || ['walking'];
  return allowed.includes(mode);
}

function calculateTime(distance: number, mode: TransportMode): number {
  return Math.ceil(distance / SPEEDS[mode]);
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

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const edge of edges) {
    if (!canTraverse(edge, mode)) continue;
    const source = nodeMap.get(edge.source_id);
    const target = nodeMap.get(edge.target_id);
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
    if (!node) return null;
    return { path: [node, node], totalDistance: 0, estimatedTime: 0 };
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const startNode = nodeMap.get(startNodeId);
  const endNode = nodeMap.get(endNodeId);

  if (!startNode || !endNode) return null;

  const openSet = new Set<string>([startNodeId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, getDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng));

  const adj = new Map<string, MapEdge[]>();
  for (const edge of edges) {
    if (!canTraverse(edge, mode)) continue;
    
    if (!adj.has(edge.source_id)) adj.set(edge.source_id, []);
    adj.get(edge.source_id)!.push(edge);
    
    if (edge.bidirectional) {
      if (!adj.has(edge.target_id)) adj.set(edge.target_id, []);
      adj.get(edge.target_id)!.push(edge);
    }
  }

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
      const result = reconstructPath(cameFrom, currentId!, nodeMap);
      result.estimatedTime = calculateTime(result.totalDistance, mode);
      return result;
    }

    if (!currentId) break;

    openSet.delete(currentId);
    const currentNode = nodeMap.get(currentId);
    if (!currentNode) continue;

    const currentG = gScore.get(currentId) ?? Infinity;
    const neighbors = adj.get(currentId) || [];

    for (const edge of neighbors) {
      const neighborId = edge.source_id === currentId ? edge.target_id : edge.source_id;
      const neighbor = nodeMap.get(neighborId);
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

function reconstructPath(cameFrom: Map<string, string>, currentId: string, nodeMap: Map<string, MapNode>): PathResult {
  const totalPath: string[] = [currentId];
  let curr = currentId;
  while (cameFrom.has(curr)) {
    curr = cameFrom.get(curr)!;
    totalPath.unshift(curr);
  }

  const pathNodes = totalPath
    .map((id) => nodeMap.get(id))
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

