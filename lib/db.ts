import Dexie, { type Table } from "dexie";
import type { RoomRowWithFacility } from "@/lib/supabase/queries/rooms";
import type { Facility } from "@/lib/types";
import type { MapNode, MapEdge } from "@/lib/types/graph";

export type CacheMetaKey = "facilities" | "rooms" | "navigation";

export interface CacheMetaEntry {
  key: CacheMetaKey;
  updatedAt: number;
}

export interface OfflineAction {
  id?: number;
  action: string;
  payload: unknown;
  timestamp: number;
}

export class VSUDatabase extends Dexie {
  rooms!: Table<RoomRowWithFacility, string>;
  facilities!: Table<Facility, string>;
  map_nodes!: Table<MapNode, string>;
  map_edges!: Table<MapEdge, string>;
  offline_queue!: Table<OfflineAction, number>;
  cache_meta!: Table<CacheMetaEntry, CacheMetaKey>;

  constructor() {
    super("VSUSmartMapDB");
    this.version(1).stores({
      rooms: "++id, id, name, room_code, facility_id",
      facilities: "++id, id, name",
      offline_queue: "++id, action, timestamp",
    });

    // Version 2: Drop tables that need primary key changes
    this.version(2).stores({
      rooms: null,
      facilities: null,
      cache_meta: "key",
    });

    // Version 3: Recreate tables with new schema
    this.version(3).stores({
      facilities: "id, name, category",
      rooms: "id, facility_id, room_code, name",
    });

    this.version(4).stores({
      map_nodes: "id, type",
      map_edges: "id, source_id, target_id",
    });
  }
}

export const db: VSUDatabase =
  typeof window === "undefined" ? (null as unknown as VSUDatabase) : new VSUDatabase();
