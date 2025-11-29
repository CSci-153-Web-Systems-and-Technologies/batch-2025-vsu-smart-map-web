"use client";

import { useEffect, useMemo } from "react";
import type { BuildingCategory } from "@/lib/constants/buildings";
import type { FacilityType } from "@/lib/constants/facilities";
import type { MapItem } from "@/lib/types/map";
import { filterMapItems } from "@/lib/map/filter-map-items";
import { useMapSearch } from "@/hooks/use-map-search";
import { CategoryFilters } from "./category-filters";
import { MapSearch } from "./map-search";

type MapSearchPanelProps = {
  items: readonly MapItem[];
  onResultsChange?: (items: MapItem[]) => void;
  onMatchCountChange?: (count: number) => void;
  initialBuildingCategory?: BuildingCategory | null;
  facilityFilters?: FacilityType[] | null;
};

export function MapSearchPanel({
  items,
  onResultsChange,
  onMatchCountChange,
  initialBuildingCategory = null,
  facilityFilters = null,
}: MapSearchPanelProps) {
  const { searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, debouncedTerm } =
    useMapSearch(initialBuildingCategory);

  const { results, matchCount } = useMemo(
    () => filterMapItems(items, debouncedTerm, selectedCategory, facilityFilters),
    [items, debouncedTerm, selectedCategory, facilityFilters],
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
    <div className="space-y-3">
      <MapSearch value={searchTerm} onChange={setSearchTerm} matchCount={matchCount} />
      <CategoryFilters value={selectedCategory} onChange={setSelectedCategory} />
    </div>
  );
}