"use client";

import { DirectoryList } from "./directory-list";
import { DirectorySearch } from "./directory-search";
import { DirectoryCategoryFilters } from "./directory-category-filters";
import { useDirectorySearch } from "@/hooks/use-directory-search";
import { Button } from "@/components/ui/button";
import type { Facility } from "@/lib/types/facility";
import { X } from "lucide-react";

export interface DirectoryContainerProps {
  facilities: Facility[];
}

export function DirectoryContainer({ facilities }: DirectoryContainerProps) {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategories,
    setSelectedCategories,
    filteredFacilities,
    hasActiveFilters,
    clearFilters,
    resultCount,
    totalCount,
  } = useDirectorySearch({ facilities });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DirectorySearch
          value={searchTerm}
          onChange={setSearchTerm}
          className="max-w-md"
        />

        <DirectoryCategoryFilters
          selected={selectedCategories}
          onChange={setSelectedCategories}
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
        <DirectoryList facilities={filteredFacilities} />
      )}
    </div>
  );
}
