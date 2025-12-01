"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMemo } from "react";
import { DirectoryList } from "./directory-list";
import { DirectorySearch } from "./directory-search";
import { DirectoryCategoryFilters } from "./directory-category-filters";
import { useDirectorySearch } from "@/hooks/use-directory-search";
import { Button } from "@/components/ui/button";
import type { Facility } from "@/lib/types/facility";
import { X } from "lucide-react";
import { FacilitySheet } from "@/components/facility/facility-sheet";

export interface DirectoryContainerProps {
  facilities: Facility[];
}

export function DirectoryContainer({ facilities }: DirectoryContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredFacilities,
    hasActiveFilters,
    clearFilters,
    resultCount,
    totalCount,
  } = useDirectorySearch({ facilities, enableUrlSync: true });

  const facilityId = searchParams.get("facility");
  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === facilityId) || null,
    [facilities, facilityId]
  );

  const handleFacilityClick = (facility: Facility) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("facility", facility.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseSheet = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("facility");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleViewOnMap = (facility: Facility) => {
    router.push(`/?facility=${facility.id}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DirectorySearch
          value={searchTerm}
          onChange={setSearchTerm}
          className="max-w-md"
        />

        <DirectoryCategoryFilters
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {resultCount} of {totalCount} facilities
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