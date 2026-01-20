import type { Facility } from "@/lib/types";
import { db } from "@/lib/db";

export async function getCachedFacilities(): Promise<Facility[] | null> {
  if (typeof window === "undefined") return null;

  try {
    const facilities = await db.facilities.toArray();
    if (facilities.length === 0) return null;
    return facilities;
  } catch (error) {
    console.warn("Failed to get facilities from IDB:", error);
    return null;
  }
}

export async function setCachedFacilities(facilities: Facility[]): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await db.transaction('rw', db.facilities, async () => {
      await db.facilities.clear();
      await db.facilities.bulkAdd(facilities);
    });
  } catch (error) {
    console.warn("Failed to cache facilities to IDB:", error);
  }
}

export async function clearCachedFacilities(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await db.facilities.clear();
  } catch (error) {
    console.error("Failed to clear facilities cache:", error);
  }
}
