"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapItem } from "@/lib/types/map";
import { filterMapItems } from "@/lib/map/filter-map-items";
import { useApp } from "@/lib/context/app-context";
import { CategoryFilters } from "./category-filters";
import { searchRooms } from "@/lib/supabase/queries/rooms";
import { getCachedRooms } from "@/lib/cache/rooms-cache";


type MapSearchPanelProps = {
  items: readonly MapItem[];
  onResultsChange?: (items: MapItem[]) => void;
  onMatchCountChange?: (count: number) => void;
};

export function MapSearchPanel({
  items,
  onResultsChange,
  onMatchCountChange,
}: MapSearchPanelProps) {
  const {
    debouncedQuery,
    selectedCategories,
    setCategories,
    toggleCategory,
  } = useApp();

  const [roomMatchFacilityIds, setRoomMatchFacilityIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const searchLower = debouncedQuery.toLowerCase().trim();
    if (searchLower.length < 2) {
      setRoomMatchFacilityIds(new Set());
      return;
    }

    let cancelled = false;
    const doRoomSearch = async () => {
      // Try cache first for immediate (and offline) results
      const cachedRooms = await getCachedRooms();
      if (cachedRooms && cachedRooms.length > 0) {
        const ids = new Set<string>();
        const term = searchLower;
        for (const room of cachedRooms) {
          const roomName = room.name?.toLowerCase() ?? "";
          const roomCode = room.room_code?.toLowerCase() ?? "";
          if (roomName.includes(term) || roomCode.includes(term)) {
            const fid = (room as { facility?: { id: string } }).facility?.id ?? room.facility_id;
            if (fid) ids.add(fid);
          }
        }
        if (ids.size > 0) {
          setRoomMatchFacilityIds(ids);
          // If we found results in cache and we're offline, we're done
          if (!navigator.onLine) return;
        }
      }

      const { data } = await searchRooms({ term: searchLower, includeFacility: true });
      if (cancelled) return;

      if (data && data.length > 0) {
        const ids = new Set<string>();
        for (const room of data) {
          const roomWithFacility = room as { facility_id?: string; facility?: { id?: string } };
          const fid = roomWithFacility.facility?.id ?? roomWithFacility.facility_id;
          if (fid) ids.add(fid);
        }
        setRoomMatchFacilityIds(ids);
      } else if (!cachedRooms || cachedRooms.length === 0) {
        // Only clear if we didn't have cache results either
        setRoomMatchFacilityIds(new Set());
      }
    };

    const timer = setTimeout(() => void doRoomSearch(), 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [debouncedQuery]);

  const { results, matchCount } = useMemo(
    () => filterMapItems(items, debouncedQuery, selectedCategories, roomMatchFacilityIds),
    [items, debouncedQuery, selectedCategories, roomMatchFacilityIds],
  );

  useEffect(() => {
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  useEffect(() => {
    if (onMatchCountChange) {
      onMatchCountChange(matchCount);
    }
  }, [matchCount, onMatchCountChange]);

  return (
    <CategoryFilters
      value={selectedCategories}
      onChange={setCategories}
      onToggle={toggleCategory}
    />
  );
}
