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
import { useMapStyle } from "@/lib/context/map-style-context";

interface AppState {
  selectedFacility: Facility | null;
  pendingFacilityId: string | null;
  facilitySheetOpen: boolean;
  searchQuery: string;
  debouncedQuery: string;
  selectedCategories: FacilityCategory[];
  activeTab: "map" | "directory" | "chat";
  mapStyle: "vector" | "satellite";
}

interface AppContextValue extends AppState {
  selectFacility: (facility: Facility | null) => void;
  resolvePendingFacility: (facility: Facility) => void;
  setFacilitySheetOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCategories: (categories: FacilityCategory[]) => void;
  toggleCategory: (category: FacilityCategory) => void;
  setActiveTab: (
    tab: AppState["activeTab"],
    options?: { clearSelection?: boolean; selectFacilityAfter?: Facility }
  ) => void;
  setMapStyle: (style: "vector" | "satellite") => void;
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
  const { mapStyle, setMapStyle } = useMapStyle();

  const lastSyncedFacilityId = useRef<string | null>(null);
  const lastSyncedCategory = useRef<FacilityCategory[]>([]);
  const lastSyncedSearch = useRef<string>("");
  const isUserClosing = useRef(false);
  const isNavigating = useRef(false);

  const initialSearch = searchParams.get("q") ?? "";
  const initialFacilityId = searchParams.get("facility") ?? null;

  // Initialize from URL only (not localStorage to avoid hydration mismatch)
  const [selectedCategories, setSelectedCategories] = useState<FacilityCategory[]>(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory) {
      return urlCategory.split(",").filter(isValidCategory);
    }
    // Default to academic and administrative if no URL param
    return ["academic", "administrative"];
  });

  // Track if initial hydration from localStorage is complete
  const [isHydrated, setIsHydrated] = useState(false);

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [pendingFacilityId, setPendingFacilityId] = useState<string | null>(initialFacilityId);
  const [facilitySheetOpen, setFacilitySheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [activeTab, setActiveTabState] = useState<AppState["activeTab"]>("map");

  // Hydrate from localStorage on client-side mount ONCE (not on every searchParams change)
  useEffect(() => {
    // Only hydrate from localStorage if there's no URL category param on initial load
    const urlCategory = new URLSearchParams(window.location.search).get("category");
    if (!urlCategory) {
      const stored = localStorage.getItem("map-filters");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.every(isValidCategory)) {
            setSelectedCategories(parsed);
          }
        } catch {
          // ignore error
        }
      }
    }
    setIsHydrated(true);
  }, []); // Empty dependency - run only once on mount

  // Persist to local storage (only after hydration to avoid overwriting)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("map-filters", JSON.stringify(selectedCategories));
    }
  }, [selectedCategories, isHydrated]);

  useEffect(() => {
    lastSyncedFacilityId.current = initialFacilityId;
    lastSyncedCategory.current = selectedCategories; // sync initial state
    lastSyncedSearch.current = initialSearch;
  }, [initialFacilityId, initialSearch, selectedCategories]); // Added selectedCategories

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const currentFacilityId = selectedFacility?.id ?? pendingFacilityId ?? null;

  const navigationTargetRef = useRef<string | null>(null);
  const pendingFacilityRef = useRef<Facility | null>(null);

  useEffect(() => {
    if (navigationTargetRef.current && pathname === navigationTargetRef.current) {
      navigationTargetRef.current = null;

      // Select pending facility if it exists
      if (pendingFacilityRef.current) {
        const facilityToSelect = pendingFacilityRef.current;
        pendingFacilityRef.current = null;
        // Use setTimeout to ensure pathname update has been processed
        setTimeout(() => {
          setSelectedFacility(facilityToSelect);
          setPendingFacilityId(facilityToSelect.id);
        }, 0);
      }

      // Delay resetting isNavigating to allow searchParams to settle
      const timeout = setTimeout(() => {
        isNavigating.current = false;
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  useEffect(() => {
    if (isNavigating.current) {
      return;
    }

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (debouncedQuery.trim()) {
        params.set("q", debouncedQuery.trim());
      } else {
        params.delete("q");
      }

      if (selectedCategories.length > 0) {
        params.set("category", selectedCategories.join(","));
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
        lastSyncedCategory.current = selectedCategories;
        lastSyncedSearch.current = debouncedQuery.trim();
        return;
      }

      lastSyncedFacilityId.current = currentFacilityId;
      lastSyncedCategory.current = selectedCategories;
      lastSyncedSearch.current = debouncedQuery.trim();
      const newUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [debouncedQuery, selectedCategories, currentFacilityId, pathname, router, searchParams]);

  useEffect(() => {
    if (isNavigating.current) return;

    const urlFacilityId = searchParams.get("facility");

    if (isUserClosing.current) return;

    if (urlFacilityId && urlFacilityId !== lastSyncedFacilityId.current) {
      setPendingFacilityId(urlFacilityId);
      if (selectedFacility?.id !== urlFacilityId) {
        setSelectedFacility(null);
      }
      lastSyncedFacilityId.current = urlFacilityId;
    }
  }, [searchParams, selectedCategories, selectedFacility]);

  useEffect(() => {
    if (pathname.startsWith("/directory")) setActiveTabState("directory");
    else if (pathname.startsWith("/chat")) setActiveTabState("chat");
    else setActiveTabState("map");
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") {
      setFacilitySheetOpen(false);
    }
  }, [pathname]);

  const selectFacility = useCallback((facility: Facility | null) => {
    if (facility === null) {
      isUserClosing.current = true;
      setTimeout(() => { isUserClosing.current = false; }, CLOSE_GUARD_MS);
      setFacilitySheetOpen(false);
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

  const toggleCategory = useCallback((category: FacilityCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategories([]);
  }, []);

  const setActiveTab = useCallback((
    tab: AppState["activeTab"],
    options?: { clearSelection?: boolean; selectFacilityAfter?: Facility }
  ) => {
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
    if (selectedCategories.length > 0) {
      params.set("category", selectedCategories.join(","));
    }

    // Only include facility ID if not selecting after navigation
    const facilityId = selectedFacility?.id ?? pendingFacilityId;
    if (facilityId && !options?.clearSelection && !options?.selectFacilityAfter) {
      params.set("facility", facilityId);
    }

    const queryString = params.toString();
    const fullUrl = queryString ? `${targetRoute}?${queryString}` : targetRoute;

    isNavigating.current = true;
    navigationTargetRef.current = targetRoute;

    // Store facility to select after navigation
    if (options?.selectFacilityAfter) {
      pendingFacilityRef.current = options.selectFacilityAfter;
    }

    setActiveTabState(tab);
    router.push(fullUrl, { scroll: false });
  }, [router, debouncedQuery, selectedCategories, selectedFacility?.id, pendingFacilityId]);

  const value = useMemo<AppContextValue>(() => ({
    selectedFacility,
    pendingFacilityId,
    facilitySheetOpen,
    searchQuery,
    debouncedQuery,
    selectedCategories,
    setCategories: setSelectedCategories,
    toggleCategory,
    activeTab,
    mapStyle,
    selectFacility,
    resolvePendingFacility,
    setFacilitySheetOpen,
    setSearchQuery,
    setActiveTab,
    setMapStyle,
    clearFilters,
  }), [
    selectedFacility,
    pendingFacilityId,
    facilitySheetOpen,
    searchQuery,
    debouncedQuery,
    selectedCategories,
    activeTab,
    mapStyle,
    selectFacility,
    resolvePendingFacility,
    setFacilitySheetOpen,
    setSelectedCategories,
    toggleCategory,
    setActiveTab,
    setMapStyle,
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
