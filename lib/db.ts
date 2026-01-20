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

export class VSUDatabase extends Dexie {
  rooms!: Table<RoomRowWithFacility, string>;
  facilities!: Table<Facility, string>;
  offline_queue!: Table<OfflineAction, number>;
  cache_meta!: Table<CacheMetaEntry, CacheMetaKey>;

  constructor() {
    super("VSUSmartMapDB");
    this.version(1).stores({
      rooms: "++id, id, name, room_code, facility_id",
      facilities: "++id, id, name",
      offline_queue: "++id, action, timestamp",
    });

    this.version(2).stores({
      facilities: "id, name, category",
      rooms: "id, facility_id, room_code, name",
      offline_queue: "++id, action, timestamp",
      cache_meta: "key",
    });
  }
}

export const db: VSUDatabase =
  typeof window === "undefined" ? (null as unknown as VSUDatabase) : new VSUDatabase();
