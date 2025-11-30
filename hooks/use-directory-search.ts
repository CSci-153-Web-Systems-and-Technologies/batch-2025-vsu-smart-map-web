"use client";

import { useEffect, useMemo, useState } from "react";
import type { Facility, FacilityCategory } from "@/lib/types/facility";

const DEBOUNCE_MS = 300;

export interface UseDirectorySearchOptions {
  facilities: Facility[];
  initialSearch?: string;
  initialCategories?: FacilityCategory[];
}

export interface UseDirectorySearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedTerm: string;
  selectedCategories: FacilityCategory[];
  setSelectedCategories: (categories: FacilityCategory[]) => void;
  filteredFacilities: Facility[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  resultCount: number;
  totalCount: number;
}

export function useDirectorySearch({
  facilities,
  initialSearch = "",
  initialCategories = [],
}: UseDirectorySearchOptions): UseDirectorySearchReturn {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedTerm, setDebouncedTerm] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] =
    useState<FacilityCategory[]>(initialCategories);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const searchLower = debouncedTerm.toLowerCase().trim();

      const matchesSearch =
        searchLower === "" ||
        facility.name.toLowerCase().includes(searchLower) ||
        facility.code?.toLowerCase().includes(searchLower) ||
        facility.description?.toLowerCase().includes(searchLower);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(facility.category);

      return matchesSearch && matchesCategory;
    });
  }, [facilities, debouncedTerm, selectedCategories]);

  const hasActiveFilters = debouncedTerm !== "" || selectedCategories.length > 0;

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedTerm("");
    setSelectedCategories([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedTerm,
    selectedCategories,
    setSelectedCategories,
    filteredFacilities,
    hasActiveFilters,
    clearFilters,
    resultCount: filteredFacilities.length,
    totalCount: facilities.length,
  };
}
