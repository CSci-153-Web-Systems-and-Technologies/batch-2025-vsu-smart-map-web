"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Facility, FacilityCategory } from "@/lib/types/facility";
import { FACILITY_CATEGORY_META } from "@/lib/constants/facilities";

const DEBOUNCE_MS = 300;
const URL_SYNC_DEBOUNCE_MS = 500;

const VALID_CATEGORIES = Object.keys(FACILITY_CATEGORY_META) as FacilityCategory[];

export interface UseDirectorySearchOptions {
  facilities: Facility[];
  initialSearch?: string;
  initialCategories?: FacilityCategory[];
  enableUrlSync?: boolean;
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
  enableUrlSync = false,
}: UseDirectorySearchOptions): UseDirectorySearchReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlSearch = enableUrlSync ? (searchParams.get("q") ?? "") : initialSearch;
  const urlCategories = enableUrlSync
    ? searchParams
        .getAll("category")
        .filter((c): c is FacilityCategory => VALID_CATEGORIES.includes(c as FacilityCategory))
    : initialCategories;

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedTerm, setDebouncedTerm] = useState(urlSearch);
  const [selectedCategories, setSelectedCategories] =
    useState<FacilityCategory[]>(urlCategories);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const updateUrl = useCallback(
    (search: string, categories: FacilityCategory[]) => {
      if (!enableUrlSync) return;

      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("q", search.trim());
      }
      categories.forEach((c) => params.append("category", c));

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(newUrl, { scroll: false });
    },
    [enableUrlSync, pathname, router]
  );

  useEffect(() => {
    if (!enableUrlSync) return;

    const timer = setTimeout(() => {
      updateUrl(debouncedTerm, selectedCategories);
    }, URL_SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [debouncedTerm, selectedCategories, updateUrl, enableUrlSync]);

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
