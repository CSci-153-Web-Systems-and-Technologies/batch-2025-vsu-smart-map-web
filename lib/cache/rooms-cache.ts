import type { RoomRow, RoomRowWithFacility } from "@/lib/supabase/queries/rooms";
import { db } from "@/lib/db";

export async function getCachedRooms(): Promise<(RoomRow | RoomRowWithFacility)[] | null> {
  if (typeof window === "undefined") return null;

  try {
    const rooms = await db.rooms.toArray();
    if (rooms.length === 0) return null;

    // Map back to expected structure if needed (though we store flatten structure mostly)
    // The previous implementation stored mixed types.
    // For simplicity and search speed, we just return what's in DB.
    // However, we need to ensure the consumers handle the data correctly.
    // The current schema in db.ts includes 'facility_id', so we can reconstruct partial objects if needed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DB schema stores union types that are hard to represent strictly with Dexie tables
    return rooms as any[];
  } catch (error) {
    console.warn("Failed to get rooms from IDB:", error);
    return null;
  }
}

export async function setCachedRooms(rooms: (RoomRow | RoomRowWithFacility)[]): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // We need to flatten or normalize 'RoomRowWithFacility' to match our simple DB schema
    // or just store the raw object if we change the schema.
    // The 'db.rooms' table is defined with specific indices. Dexie allow storing arbitrary extra fields.
    // Let's ensure 'facility_id' is present for indexing.

    const processedRooms = rooms.map(room => {
      // If it has a facility object (RoomRowWithFacility), flatten the ID for indexing
      let fid = room.facility_id;
      if ('facility' in room && room.facility?.id) {
        fid = room.facility.id;
      }
      return {
        ...room,
        facility_id: fid
      };
    });

    await db.transaction('rw', db.rooms, async () => {
      await db.rooms.clear();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Bulk adding mixed types requires looser typing
      await db.rooms.bulkAdd(processedRooms as any);
    });
  } catch (error) {
    console.warn("Failed to cache rooms to IDB:", error);
  }
}

export async function clearCachedRooms(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await db.rooms.clear();
  } catch (error) {
    console.error("Failed to clear rooms cache:", error);
  }
}
