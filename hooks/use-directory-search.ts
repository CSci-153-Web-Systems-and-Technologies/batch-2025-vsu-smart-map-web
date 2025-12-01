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
  initialCategory?: FacilityCategory | null;
  enableUrlSync?: boolean;
}

export interface UseDirectorySearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedTerm: string;
  selectedCategory: FacilityCategory | null;
  setSelectedCategory: (category: FacilityCategory | null) => void;
  filteredFacilities: Facility[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  resultCount: number;
  totalCount: number;
}

export function useDirectorySearch({
  facilities,
  initialSearch = "",
  initialCategory = null,
  enableUrlSync = false,
}: UseDirectorySearchOptions): UseDirectorySearchReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlSearch = enableUrlSync ? (searchParams.get("q") ?? "") : initialSearch;

  const paramCategory = searchParams.get("category");
  const urlCategory = enableUrlSync && paramCategory && VALID_CATEGORIES.includes(paramCategory as FacilityCategory)
    ? (paramCategory as FacilityCategory)
    : initialCategory;

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedTerm, setDebouncedTerm] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] =
    useState<FacilityCategory | null>(urlCategory);

  useEffect(() => {
    if (!enableUrlSync) return;

    const nextSearch = searchParams.get("q") ?? "";
    const nextParamCategory = searchParams.get("category");
    const nextCategory = nextParamCategory && VALID_CATEGORIES.includes(nextParamCategory as FacilityCategory)
      ? (nextParamCategory as FacilityCategory)
      : null;

    setSearchTerm(nextSearch);
    setDebouncedTerm(nextSearch);
    setSelectedCategory(nextCategory);
  }, [enableUrlSync, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const updateUrl = useCallback(
    (search: string, category: FacilityCategory | null) => {
      if (!enableUrlSync) return;

      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("q", search.trim());
      }
      if (category) {
        params.set("category", category);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(newUrl, { scroll: false });
    },
    [enableUrlSync, pathname, router],
  );

  useEffect(() => {
    if (!enableUrlSync) return;

    const timer = setTimeout(() => {
      updateUrl(debouncedTerm, selectedCategory);
    }, URL_SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [debouncedTerm, selectedCategory, updateUrl, enableUrlSync]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const searchLower = debouncedTerm.toLowerCase().trim();

      const matchesSearch =
        searchLower === "" ||
        facility.name.toLowerCase().includes(searchLower) ||
        facility.code?.toLowerCase().includes(searchLower) ||
        facility.description?.toLowerCase().includes(searchLower);

      const matchesCategory =
        selectedCategory === null ||
        facility.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [facilities, debouncedTerm, selectedCategory]);

  const hasActiveFilters = debouncedTerm !== "" || selectedCategory !== null;

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedTerm("");
    setSelectedCategory(null);
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedTerm,
    selectedCategory,
    setSelectedCategory,
    filteredFacilities,
    hasActiveFilters,
    clearFilters,
    resultCount: filteredFacilities.length,
    totalCount: facilities.length,
  };
}