export type GraphNodeType = 'node' | 'room_entry' | 'building_entry' | 'building_corner';
export type TransportMode = 'walking' | 'cycling' | 'driving';

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
  
  // New fields for multimodal support
  type: 'road' | 'walkway' | 'corridor' | 'stairs' | 'elevator'; 
  
  // Explicit permissions overrides (optional, defaults based on type)
  access?: TransportMode[]; 
}

export interface PathResult {
  path: MapNode[];
  totalDistance: number;
}
