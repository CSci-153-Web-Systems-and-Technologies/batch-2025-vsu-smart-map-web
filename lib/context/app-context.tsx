"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Facility, FacilityCategory } from "@/lib/types/facility";
import { FACILITY_CATEGORY_META } from "@/lib/constants/facilities";

interface AppState {
  selectedFacility: Facility | null;
  searchQuery: string;
  debouncedQuery: string;
  selectedCategory: FacilityCategory | null;
  activeTab: "map" | "directory" | "chat";
}

interface AppContextValue extends AppState {
  selectFacility: (facility: Facility | null) => void;
  setSearchQuery: (query: string) => void;
  setCategory: (category: FacilityCategory | null) => void;
  setActiveTab: (tab: AppState["activeTab"]) => void;
  clearFilters: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEBOUNCE_MS = 300;
const VALID_CATEGORIES = Object.keys(FACILITY_CATEGORY_META) as FacilityCategory[];

export function AppProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isUpdatingUrl = useRef(false);

  const initialSearch = searchParams.get("q") ?? "";
  const paramCategory = searchParams.get("category");
  const initialCategory =
    paramCategory && VALID_CATEGORIES.includes(paramCategory as FacilityCategory)
      ? (paramCategory as FacilityCategory)
      : null;

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<FacilityCategory | null>(
    initialCategory
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateUrl = useCallback(
    (query: string, category: FacilityCategory | null, facilityId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }

      if (category) {
        params.set("category", category);
      } else {
        params.delete("category");
      }

      if (facilityId) {
        params.set("facility", facilityId);
      } else {
        params.delete("facility");
      }

      const nextQueryString = params.toString();
      const currentQueryString = searchParams.toString();

      if (nextQueryString === currentQueryString) return;

      isUpdatingUrl.current = true;
      const newUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
      router.replace(newUrl, { scroll: false });

      setTimeout(() => {
        isUpdatingUrl.current = false;
      }, 50);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    updateUrl(debouncedQuery, selectedCategory, selectedFacility?.id ?? null);
  }, [debouncedQuery, selectedCategory, selectedFacility, updateUrl]);

  useEffect(() => {
    if (isUpdatingUrl.current) return;

    const urlSearch = searchParams.get("q") ?? "";
    const urlCategoryParam = searchParams.get("category");
    const urlCategory =
      urlCategoryParam && VALID_CATEGORIES.includes(urlCategoryParam as FacilityCategory)
        ? (urlCategoryParam as FacilityCategory)
        : null;
    const urlFacilityId = searchParams.get("facility");

    if (urlSearch !== searchQuery && urlSearch !== debouncedQuery) {
      setSearchQuery(urlSearch);
    }
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
    if (!urlFacilityId && selectedFacility) {
      setSelectedFacility(null);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
  }, []);

  const [activeTab, setActiveTabState] = useState<AppState["activeTab"]>("map");

  useEffect(() => {
    if (pathname.startsWith("/directory")) setActiveTabState("directory");
    else if (pathname.startsWith("/chat")) setActiveTabState("chat");
    else setActiveTabState("map");
  }, [pathname]);

  const setActiveTab = useCallback(
    (tab: AppState["activeTab"]) => {
      setActiveTabState(tab);
      if (tab === "map") router.push("/", { scroll: false });
      else if (tab === "directory") router.push("/directory", { scroll: false });
      else if (tab === "chat") router.push("/chat", { scroll: false });
    },
    [router]
  );

  const value: AppContextValue = {
    selectedFacility,
    searchQuery,
    debouncedQuery,
    selectedCategory,
    activeTab,
    selectFacility: setSelectedFacility,
    setSearchQuery,
    setCategory: setSelectedCategory,
    setActiveTab,
    clearFilters,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
