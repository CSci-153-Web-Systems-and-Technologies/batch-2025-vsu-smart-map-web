"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Facility, FacilityCategory } from "@/lib/types/facility";
import { FACILITY_CATEGORY_META } from "@/lib/constants/facilities";

interface AppState {
  selectedFacility: Facility | null;
  pendingFacilityId: string | null;
  searchQuery: string;
  debouncedQuery: string;
  selectedCategory: FacilityCategory | null;
  activeTab: "map" | "directory" | "chat";
}

interface AppContextValue extends AppState {
  selectFacility: (facility: Facility | null) => void;
  resolvePendingFacility: (facility: Facility) => void;
  setSearchQuery: (query: string) => void;
  setCategory: (category: FacilityCategory | null) => void;
  setActiveTab: (tab: AppState["activeTab"], options?: { clearSelection?: boolean }) => void;
  clearFilters: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEBOUNCE_MS = 300;
const CLOSE_GUARD_MS = 100;
const VALID_CATEGORIES = Object.keys(FACILITY_CATEGORY_META) as FacilityCategory[];

function isValidCategory(value: string | null): value is FacilityCategory {
  return value !== null && VALID_CATEGORIES.includes(value as FacilityCategory);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const lastSyncedFacilityId = useRef<string | null>(null);
  const isUserClosing = useRef(false);
  const isNavigating = useRef(false);

  const initialSearch = searchParams.get("q") ?? "";
  const initialFacilityId = searchParams.get("facility") ?? null;
  const urlCategory = searchParams.get("category");
  const initialCategory = isValidCategory(urlCategory) ? urlCategory : null;

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [pendingFacilityId, setPendingFacilityId] = useState<string | null>(initialFacilityId);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<FacilityCategory | null>(initialCategory);
  const [activeTab, setActiveTabState] = useState<AppState["activeTab"]>("map");

  useEffect(() => {
    lastSyncedFacilityId.current = initialFacilityId;
  }, [initialFacilityId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const currentFacilityId = selectedFacility?.id ?? pendingFacilityId ?? null;

  const navigationTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (navigationTargetRef.current && pathname === navigationTargetRef.current) {
      navigationTargetRef.current = null;
      isNavigating.current = false;
    }
  }, [pathname]);

  useEffect(() => {
    if (isNavigating.current) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    } else {
      params.delete("q");
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    if (currentFacilityId) {
      params.set("facility", currentFacilityId);
    } else {
      params.delete("facility");
    }

    const nextQueryString = params.toString();
    if (nextQueryString === searchParams.toString()) {
      lastSyncedFacilityId.current = currentFacilityId;
      return;
    }

    lastSyncedFacilityId.current = currentFacilityId;
    const newUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [debouncedQuery, selectedCategory, currentFacilityId, pathname, router, searchParams]);

  useEffect(() => {
    const urlSearch = searchParams.get("q") ?? "";
    const urlCategoryParam = searchParams.get("category");
    const urlCategory = isValidCategory(urlCategoryParam) ? urlCategoryParam : null;
    const urlFacilityId = searchParams.get("facility");

    if (urlSearch !== searchQuery && urlSearch !== debouncedQuery) {
      setSearchQuery(urlSearch);
    }
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }

    if (isUserClosing.current) return;

    if (urlFacilityId && urlFacilityId !== lastSyncedFacilityId.current) {
      setPendingFacilityId(urlFacilityId);
      if (selectedFacility?.id !== urlFacilityId) {
        setSelectedFacility(null);
      }
      lastSyncedFacilityId.current = urlFacilityId;
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pathname.startsWith("/directory")) setActiveTabState("directory");
    else if (pathname.startsWith("/chat")) setActiveTabState("chat");
    else setActiveTabState("map");
  }, [pathname]);

  const selectFacility = useCallback((facility: Facility | null) => {
    if (facility === null) {
      isUserClosing.current = true;
      setTimeout(() => { isUserClosing.current = false; }, CLOSE_GUARD_MS);
    }
    setSelectedFacility(facility);
    setPendingFacilityId(facility?.id ?? null);
  }, []);

  const resolvePendingFacility = useCallback((facility: Facility) => {
    if (isUserClosing.current) return;
    if (pendingFacilityId === facility.id && selectedFacility?.id !== facility.id) {
      setSelectedFacility(facility);
    }
  }, [pendingFacilityId, selectedFacility?.id]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
  }, []);

  const setActiveTab = useCallback((tab: AppState["activeTab"], options?: { clearSelection?: boolean }) => {
    if (options?.clearSelection) {
      setSelectedFacility(null);
      setPendingFacilityId(null);
    }

    const routes = { map: "/", directory: "/directory", chat: "/chat" } as const;
    const targetRoute = routes[tab];

    const params = new URLSearchParams();
    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    }
    if (selectedCategory) {
      params.set("category", selectedCategory);
    }
    const facilityId = selectedFacility?.id ?? pendingFacilityId;
    if (facilityId && !options?.clearSelection) {
      params.set("facility", facilityId);
    }

    const queryString = params.toString();
    const fullUrl = queryString ? `${targetRoute}?${queryString}` : targetRoute;

    isNavigating.current = true;
    navigationTargetRef.current = targetRoute;

    setActiveTabState(tab);
    router.push(fullUrl, { scroll: false });
  }, [router, debouncedQuery, selectedCategory, selectedFacility?.id, pendingFacilityId]);

  const value = useMemo<AppContextValue>(() => ({
    selectedFacility,
    pendingFacilityId,
    searchQuery,
    debouncedQuery,
    selectedCategory,
    activeTab,
    selectFacility,
    resolvePendingFacility,
    setSearchQuery,
    setCategory: setSelectedCategory,
    setActiveTab,
    clearFilters,
  }), [
    selectedFacility,
    pendingFacilityId,
    searchQuery,
    debouncedQuery,
    selectedCategory,
    activeTab,
    selectFacility,
    resolvePendingFacility,
    setActiveTab,
    clearFilters,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
