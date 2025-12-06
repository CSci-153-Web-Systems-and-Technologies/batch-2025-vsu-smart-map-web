import type { Facility } from "@/lib/types";

const FACILITIES_STORAGE_KEY = "vsu-smartmap-facilities";
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface CachedFacilities {
  data: Facility[];
  timestamp: number;
}

export function getCachedFacilities(): Facility[] | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(FACILITIES_STORAGE_KEY);
    if (!stored) return null;

    const parsed: CachedFacilities = JSON.parse(stored);
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

export function setCachedFacilities(facilities: Facility[]): void {
  if (typeof window === "undefined") return;

  try {
    const cached: CachedFacilities = {
      data: facilities,
      timestamp: Date.now(),
    };
    localStorage.setItem(FACILITIES_STORAGE_KEY, JSON.stringify(cached));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("Facilities cache storage quota exceeded");
    }
  }
}

export function clearCachedFacilities(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(FACILITIES_STORAGE_KEY);
  } catch {
  }
}
