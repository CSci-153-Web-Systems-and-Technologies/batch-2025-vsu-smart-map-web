import Dexie, { type Table } from "dexie";
import type { RoomRowWithFacility } from "@/lib/supabase/queries/rooms";
import type { Facility } from "@/lib/types";

export type CacheMetaKey = "facilities" | "rooms";

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

export class CampusMapDatabase extends Dexie {
  rooms!: Table<RoomRowWithFacility, string>;
  facilities!: Table<Facility, string>;
  offline_queue!: Table<OfflineAction, number>;
  cache_meta!: Table<CacheMetaEntry, CacheMetaKey>;

  constructor() {
    super("CampusSmartMapDB");
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
  }
}

export const db: CampusMapDatabase =
  typeof window === "undefined"
    ? (null as unknown as CampusMapDatabase)
    : new CampusMapDatabase();
