"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapItem } from "@/lib/types/map";
import { filterMapItems } from "@/lib/map/filter-map-items";
import { useApp } from "@/lib/context/app-context";
import { CategoryFilters } from "./category-filters";
import { searchRooms } from "@/lib/supabase/queries/rooms";


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
    selectedCategory,
    setCategory,
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
      } else {
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
    () => filterMapItems(items, debouncedQuery, selectedCategory, roomMatchFacilityIds),
    [items, debouncedQuery, selectedCategory, roomMatchFacilityIds],
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
    <CategoryFilters value={selectedCategory} onChange={setCategory} />
  );
}
