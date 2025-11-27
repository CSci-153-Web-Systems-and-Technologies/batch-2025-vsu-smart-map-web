"use client";

import { useEffect, useMemo } from "react";
import type { BuildingCategory } from "@/lib/constants/buildings";
import type { MapMarkerPayload } from "@/lib/types/building";
import { filterMarkers } from "@/lib/map/filter-buildings";
import { useMapSearch } from "@/hooks/use-map-search";
import { CategoryFilters } from "./category-filters";
import { MapSearch } from "./map-search";

type MapSearchPanelProps = {
  markers: readonly MapMarkerPayload[];
  onResultsChange?: (markers: MapMarkerPayload[]) => void;
  onMatchCountChange?: (count: number) => void;
  initialCategory?: BuildingCategory | null;
};

export function MapSearchPanel({
  markers,
  onResultsChange,
  onMatchCountChange,
  initialCategory = null,
}: MapSearchPanelProps) {
  const { searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, debouncedTerm } =
    useMapSearch(initialCategory);

  const { results, matchCount } = useMemo(
    () => filterMarkers(markers, debouncedTerm, selectedCategory),
    [markers, debouncedTerm, selectedCategory],
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
