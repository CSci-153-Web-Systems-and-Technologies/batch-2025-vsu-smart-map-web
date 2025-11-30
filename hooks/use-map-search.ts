"use client";

import { useEffect, useMemo, useState } from "react";
import type { FacilityCategory } from "@/lib/types/facility";

const DEBOUNCE_MS = 300;

export function useMapSearch(initialCategory: FacilityCategory | null = null) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FacilityCategory | null>(initialCategory);
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(searchTerm), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const reset = useMemo(
    () => ({
      clearSearch: () => setSearchTerm(""),
      clearCategory: () => setSelectedCategory(null),
    }),
    [],
  );

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    debouncedTerm,
    ...reset,
  };
}