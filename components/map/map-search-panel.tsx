"use client";

import { useEffect, useMemo } from "react";
import type { MapItem } from "@/lib/types/map";
import { filterMapItems } from "@/lib/map/filter-map-items";
import { useApp } from "@/lib/context/app-context";
import { CategoryFilters } from "./category-filters";
import { MapSearch } from "./map-search";

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
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    selectedCategory,
    setCategory,
  } = useApp();

  const { results, matchCount } = useMemo(
    () => filterMapItems(items, debouncedQuery, selectedCategory),
    [items, debouncedQuery, selectedCategory],
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
      <MapSearch value={searchQuery} onChange={setSearchQuery} matchCount={matchCount} />
      <CategoryFilters value={selectedCategory} onChange={setCategory} />
    </div>
  );
}
