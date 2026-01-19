import type { RoomRow, RoomRowWithFacility } from "@/lib/supabase/queries/rooms";

const ROOMS_STORAGE_KEY = "vsu-smartmap-rooms-v1";
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 60 minutes

interface CachedRooms {
  data: (RoomRow | RoomRowWithFacility)[];
  timestamp: number;
}

export function getCachedRooms(): (RoomRow | RoomRowWithFacility)[] | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (!stored) return null;

    const parsed: CachedRooms = JSON.parse(stored);
    const age = Date.now() - parsed.timestamp;

    if (!navigator.onLine) {
      return parsed.data;
    }

    if (age < CACHE_MAX_AGE_MS) {
      return parsed.data;
    }

    return null;
  } catch {
    return null;
  }
}

export function setCachedRooms(rooms: (RoomRow | RoomRowWithFacility)[]): void {
  if (typeof window === "undefined") return;

  try {
    const cached: CachedRooms = {
      data: rooms,
      timestamp: Date.now(),
    };
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(cached));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("Rooms cache storage quota exceeded");
    }
  }
}

export function clearCachedRooms(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(ROOMS_STORAGE_KEY);
  } catch {
  }
}
