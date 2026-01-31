export type GraphNodeType = 'node' | 'room_entry' | 'building_entry' | 'building_corner';

export interface MapNode {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type: GraphNodeType;
  building_id?: string;
  floor_level?: number;
}

export interface MapEdge {
  id: string;
  source_id: string;
  target_id: string;
  weight: number;
  bidirectional: boolean;
}

export interface PathResult {
  path: MapNode[];
  totalDistance: number;
}
