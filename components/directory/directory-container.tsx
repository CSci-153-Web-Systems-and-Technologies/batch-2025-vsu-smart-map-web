"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useEffect, useRef } from "react";
import { DirectoryList } from "./directory-list";
import { DirectorySearch } from "./directory-search";
import { DirectoryCategoryFilters } from "./directory-category-filters";
import { Button } from "@/components/ui/button";
import type { Facility } from "@/lib/types/facility";
import { X } from "lucide-react";
import { FacilitySheet } from "@/components/facility/facility-sheet";
import { useApp } from "@/lib/context/app-context";

export interface DirectoryContainerProps {
  facilities: Facility[];
}

export function DirectoryContainer({ facilities }: DirectoryContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setCategory,
    selectedFacility,
    selectFacility,
    clearFilters,
  } = useApp();

  const hasHydrated = useRef(false);
  useEffect(() => {
    if (hasHydrated.current) return;
    const facilityId = searchParams.get("facility");
    if (facilityId) {
      const found = facilities.find((f) => f.id === facilityId);
      if (found) {
        selectFacility(found);
        hasHydrated.current = true;
      }
    }
  }, [searchParams, facilities, selectFacility]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const searchLower = searchQuery.toLowerCase().trim();

      const matchesSearch =
        searchLower === "" ||
        facility.name.toLowerCase().includes(searchLower) ||
        facility.code?.toLowerCase().includes(searchLower) ||
        facility.description?.toLowerCase().includes(searchLower);

      const matchesCategory =
        selectedCategory === null || facility.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [facilities, searchQuery, selectedCategory]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== null;

  const handleFacilityClick = (facility: Facility) => {
    selectFacility(facility);
  };

  const handleCloseSheet = () => {
    selectFacility(null);
  };

  const handleViewOnMap = (facility: Facility) => {
    router.push(`/?facility=${facility.id}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DirectorySearch
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-md"
        />

        <DirectoryCategoryFilters
          selected={selectedCategory}
          onChange={setCategory}
        />
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredFacilities.length} of {facilities.length} facilities
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 gap-1 px-2 text-xs"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </Button>
        </div>
      )}

      {filteredFacilities.length === 0 && hasActiveFilters ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground">
            No facilities match your filters.
          </p>
          <Button
            type="button"
            variant="link"
            onClick={clearFilters}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <DirectoryList
          facilities={filteredFacilities}
          onFacilityClick={handleFacilityClick}
          onViewOnMap={handleViewOnMap}
        />
      )}

      <FacilitySheet
        facility={selectedFacility}
        open={!!selectedFacility}
        onClose={handleCloseSheet}
      />
    </div>
  );
}