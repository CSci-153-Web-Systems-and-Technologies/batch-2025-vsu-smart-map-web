import Dexie, { type Table } from 'dexie';
import type { RoomRow } from "@/lib/supabase/queries/rooms";
import type { Facility } from '@/lib/types';

export interface OfflineAction {
  id?: number;
  action: string;
  payload: unknown;
  timestamp: number;
}

export class VSUDatabase extends Dexie {
  rooms!: Table<RoomRow & { facility_id: string }, number>;
  facilities!: Table<Facility, number>;
  offline_queue!: Table<OfflineAction, number>;

  constructor() {
    super('VSUSmartMapDB');
    this.version(1).stores({
      rooms: '++id, id, name, room_code, facility_id',
      facilities: '++id, id, name',
      offline_queue: '++id, action, timestamp'
    });
  }
}

export const db = new VSUDatabase();
