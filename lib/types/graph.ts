export type GraphNodeType = 'node' | 'building_entry' | 'path_start' | 'path_middle' | 'path_end';
export type TransportMode = 'walking' | 'cycling' | 'driving';

export interface MapNode {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type: GraphNodeType;
  building_ids?: string[];
  floor_level?: number;
}

export interface MapEdge {
  id: string;
  source_id: string;
  target_id: string;
  weight: number;
  bidirectional: boolean;
  
  type: 'road' | 'walkway'; 
  
  access?: TransportMode[]; 

  is_closed?: boolean;
  closed_from?: string;
  closed_until?: string;
  closure_reason?: string;
  
  // Recurring closure (e.g. closed every night 10PM-6AM)
  closure_recurring_start?: string; // "HH:MM" 24h format
  closure_recurring_end?: string;   // "HH:MM" 24h format
  closure_recurring_days?: number[]; // 0=Sunday, 1=Monday, ...
}

export interface PathResult {
  path: MapNode[];
  totalDistance: number;
  estimatedTime?: number;
}
