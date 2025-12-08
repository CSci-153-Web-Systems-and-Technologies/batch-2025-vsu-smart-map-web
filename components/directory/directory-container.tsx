"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DirectoryList } from "./directory-list";

import { CategoryFilters } from "../map/category-filters";
import { Button } from "@/components/ui/button";
import type { Facility } from "@/lib/types/facility";
import { useApp } from "@/lib/context/app-context";


export interface DirectoryContainerProps {
  facilities: Facility[];
}

export function DirectoryContainer({ facilities }: DirectoryContainerProps) {
  const router = useRouter();
  const {
    searchQuery,
    selectedCategory,
    setCategory,
    clearFilters,
    selectFacility,
  } = useApp();


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

  const handleViewOnMap = (facility: Facility) => {
    router.push(`/?facility=${facility.id}`, { scroll: false });
  };



  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4 flex-1 min-w-0">


            <CategoryFilters
              value={selectedCategory}
              onChange={setCategory}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredFacilities.length} of {facilities.length} facilities
          </p>
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
            onFacilityClick={selectFacility}
            onViewOnMap={handleViewOnMap}
          />
        )}
      </div>


    </>
  );
}
