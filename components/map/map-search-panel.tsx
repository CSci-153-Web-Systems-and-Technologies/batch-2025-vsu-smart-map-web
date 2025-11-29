"use client";

import { useEffect, useMemo } from "react";
import type { BuildingCategory } from "@/lib/constants/buildings";
import { FACILITY_TYPES } from "@/lib/constants/facilities";
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
  facilityFilters?: FacilityType[];
  onFacilityFiltersChange?: (types: FacilityType[]) => void;
};

export function MapSearchPanel({
  items,
  onResultsChange,
  onMatchCountChange,
  initialBuildingCategory = null,
  facilityFilters = [],
  onFacilityFiltersChange,
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

  const toggleFacility = (type: FacilityType) => {
    if (!onFacilityFiltersChange) return;
    if (facilityFilters.includes(type)) {
      onFacilityFiltersChange(facilityFilters.filter((t) => t !== type));
    } else {
      onFacilityFiltersChange([...facilityFilters, type]);
    }
  };

  const clearFacilities = () => {
    onFacilityFiltersChange?.([]);
  };

  return (
    <div className="space-y-3">
      <MapSearch value={searchTerm} onChange={setSearchTerm} matchCount={matchCount} />
      <CategoryFilters value={selectedCategory} onChange={setSelectedCategory} />
      <FacilityFilters value={facilityFilters} onToggle={toggleFacility} onClear={clearFacilities} />
    </div>
  );
}

function FacilityFilters({
  value,
  onToggle,
  onClear,
}: {
  value: FacilityType[];
  onToggle: (type: FacilityType) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filter facilities">
      <button
        type="button"
        onClick={onClear}
        className={`rounded-full border px-3 py-1 text-xs ${
          value.length === 0 ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
        }`}
      >
        All facilities
      </button>
      {FACILITY_TYPES.map((type) => {
        const active = value.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-foreground hover:border-muted-foreground/60"
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}
