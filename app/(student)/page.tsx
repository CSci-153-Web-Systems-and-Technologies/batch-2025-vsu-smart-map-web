"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { MapContainerClient } from "@/components/map/map-container";
import { MapSearchPanel } from "@/components/map/map-search-panel";
import type { Facility } from "@/lib/types/facility";
import { getFacilitiesLite } from "@/lib/supabase/queries/facilities";
import { useApp } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SuggestAddModal } from "@/components/suggestions/suggest-add-modal";
import { getCachedFacilities, setCachedFacilities } from "@/lib/cache/facilities-cache";
import { getCachedNavigationGraph, setCachedNavigationGraph } from "@/lib/cache/navigation-cache";
import { searchRooms } from "@/lib/supabase/queries/rooms";
import { getMapNodes, getMapEdges } from "@/lib/supabase/queries/navigation";
import { setCachedRooms } from "@/lib/cache/rooms-cache";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { LatLng, LatLngBoundsExpression } from "leaflet";
import type { TransportMode } from "@/lib/types/graph";

const MapSelectionLayer = dynamic(
  () => import("@/components/map/map-selection-layer").then((m) => m.MapSelectionLayer),
  { ssr: false },
);

const UserLocationControl = dynamic(
  () => import("@/components/map/user-location-control").then((m) => m.UserLocationControl),
  { ssr: false },
);

const NavigationLayer = dynamic(
  () => import("@/components/map/navigation-layer").then((m) => m.NavigationLayer),
  { ssr: false },
);

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageSkeleton() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-background px-4 py-10 md:px-6">
      <div className="h-[560px] rounded-xl border border-border bg-muted animate-pulse" />
    </main>
  );
}

function HomePageContent() {
  return <MapTab />;
}

function MapTab() {
  const { selectedFacility, selectFacility, pendingFacilityId, resolvePendingFacility } = useApp();
  const [items, setItems] = useState<readonly Facility[]>([]);
  const [filtered, setFiltered] = useState<readonly Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: MapNode[]; edges: MapEdge[] }>({ nodes: [], edges: [] });

  useEffect(() => {
      const load = async () => {
        const cached = await getCachedFacilities();
        const cachedNav = await getCachedNavigationGraph();
        
        if (cached && cached.length > 0) {
          setItems(cached);
          setFiltered(cached);
          setIsLoading(false);
        } else {
          setIsLoading(true);
        }

        const loadNavigation = async () => {
           if (cachedNav) {
             setGraphData(cachedNav);
           }
           
           try {
             const [nodesRes, edgesRes] = await Promise.all([
               getMapNodes(),
               getMapEdges()
             ]);
             
             if (nodesRes.data && edgesRes.data) {
               setGraphData({ nodes: nodesRes.data, edges: edgesRes.data });
               await setCachedNavigationGraph(nodesRes.data, edgesRes.data);
             }
           } catch (e) {
             console.warn("Failed to sync navigation graph", e);
           }
        };

        // Pre-fetch rooms for search indexing/offline use
      // This is done in the background to avoid blocking facility loading
      const loadRooms = async () => {
        try {
          const { data: roomData } = await searchRooms({ term: "", includeFacility: true });
          if (roomData) {
            setCachedRooms(roomData);
          }
        } catch (e) {
          console.warn("Failed to pre-fetch rooms for offline cache", e);
        }
      };

        const fetchFacilities = async (fallbackCache: Facility[] | null) => {
        const { data, error: fetchError } = await getFacilitiesLite();

        if (fetchError || !data) {
          if (fallbackCache && fallbackCache.length > 0) {
            setError(null);
          } else {
            setError("Unable to load map data. Please try again later.");
            setItems([]);
            setFiltered([]);
          }
          setIsLoading(false);
          return;
        }

        // Cast Lite objects to Facility for now since coordinates/etc match.
        // The components will need to handle missing descriptions if they try to access them.
        // We'll fix the cache logic to handle Lite objects in a moment or cast it.
        setCachedFacilities(data as unknown as Facility[]);
        setItems(data as unknown as Facility[]);
        setFiltered(data as unknown as Facility[]);
        setError(null);
        setIsLoading(false);
      };

      void Promise.all([fetchFacilities(cached), loadRooms(), loadNavigation()]);
    };

    void load();
  }, []);

  useEffect(() => {
    if (!items.length || !pendingFacilityId) return;
    if (selectedFacility?.id === pendingFacilityId) return;

    const match = items.find((facility) => facility.id === pendingFacilityId);
    if (match) {
      resolvePendingFacility(match);
    }
  }, [items, pendingFacilityId, selectedFacility, resolvePendingFacility]);

  return (
    <section
      id="map-panel"
      role="tabpanel"
      aria-label="Map panel"
      className="relative flex h-full w-full flex-col overflow-hidden bg-background"
      tabIndex={0}
    >
      {/* Filter Bar */}
      <div className="w-full border-b bg-background/95 backdrop-blur z-20 px-4 py-1.5 shrink-0 flex justify-center items-center">
        <MapSearchPanel
          items={items}
          onResultsChange={(results) => setFiltered(results as Facility[])}
        />
      </div>

      <div className="relative flex-1 w-full overflow-hidden">
        {/* Floating Action Button (Submit) */}
        {/* Adjusted bottom position to clear mobile tabs (approx 4rem/64px + 1rem buffer = bottom-20 or bottom-24) */}
        {/* Desktop remains bottom-8 */}
        <div className="absolute right-6 bottom-24 z-30 md:right-8 md:bottom-8">
          <Button
            type="button"
            size="default"
            className="rounded-full shadow-lg gap-2 font-semibold"
            onClick={() => setSuggestOpen(true)}
            title="Submit a location"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden md:inline">Submit Location</span>
            <span className="md:hidden sr-only">Submit Location</span>
          </Button>
        </div>

        <MapView
          filtered={filtered}
          isLoading={isLoading}
          error={error}
          selectedId={selectedFacility?.id ?? null}
          selectedFacility={selectedFacility} // Pass selectedFacility
          onSelect={(id) => {
            const facility = items.find((f) => f.id === id) || null;
            selectFacility(facility);
          }}
          onClearSelection={() => selectFacility(null)}
          graphData={graphData}
        />
      </div>

      <SuggestAddModal
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        onSuccess={() => setSuggestOpen(false)}
      />
    </section>
  );
}

import { useNavigationPersistence } from "@/hooks/use-navigation-persistence";
import type { MapNode, MapEdge } from "@/lib/types/graph";

function MapView({
  filtered,
  isLoading,
  error,
  selectedId,
  selectedFacility, // Receive selectedFacility prop
  onSelect,
  onClearSelection,
  graphData,
}: {
  filtered: readonly Facility[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
  selectedFacility: Facility | null; 
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  graphData: { nodes: MapNode[], edges: MapEdge[] };
}) {
  const { selectedCategories, debouncedQuery } = useApp();
  const hasResults = filtered.length > 0;
  const hasActiveFilters = selectedCategories.length > 0 || debouncedQuery.trim().length > 0;
  
  const { position, startTracking, isTracking } = useGeolocation();
  
  // Use persistent navigation state
  const { navStart, setNavStart, navEnd, setNavEnd, clearNavigation } = useNavigationPersistence();
  
  const [navMode] = useState<TransportMode>('walking');
  const [mapBounds, setMapBounds] = useState<LatLngBoundsExpression | null>(null);
  const [isNavigatingFromUser, setIsNavigatingFromUser] = useState(false);

  useEffect(() => {
    // Only update if we are actively navigating from user AND position is available
    if (isNavigatingFromUser && position && navEnd) {
      setNavStart({ lat: position.coords.latitude, lng: position.coords.longitude } as LatLng);
    }
  }, [position, isNavigatingFromUser, navEnd, setNavStart]);

  useEffect(() => {
      const consent = typeof window !== 'undefined' && localStorage.getItem("vsu-smartmap-location-consent") === "true";
      if (consent && !isTracking) {
          startTracking();
      }
  }, [isTracking, startTracking]);

  useEffect(() => {
      if (!navStart || !navEnd) {
          setMapBounds(null);
      }
  }, [navStart, navEnd]);

  useEffect(() => {
      const handleNavRequest = (e: CustomEvent<Facility>) => {
          if (position) {
              setNavStart({ lat: position.coords.latitude, lng: position.coords.longitude } as LatLng);
              setIsNavigatingFromUser(true);
          } else {
              setIsNavigatingFromUser(false);
          }
          setNavEnd({ lat: e.detail.coordinates.lat, lng: e.detail.coordinates.lng } as LatLng);
      };
      
      window.addEventListener('navigate-to-facility', handleNavRequest as EventListener);
      return () => window.removeEventListener('navigate-to-facility', handleNavRequest as EventListener);
  }, [position, setNavStart, setNavEnd]);

  return (
    <div className="relative h-full w-full">
      <div className="relative h-full w-full overflow-hidden">
        <MapContainerClient className="h-full w-full" bounds={mapBounds}>
          <MapSelectionLayer
            items={filtered}
            selectedId={selectedId}
            onSelect={(item) => onSelect(item.id)}
            onDirections={(item) => {
               if (position) {
                   setNavStart({ lat: position.coords.latitude, lng: position.coords.longitude } as LatLng);
                   setIsNavigatingFromUser(true);
               }
               setNavEnd({ lat: item.coordinates.lat, lng: item.coordinates.lng } as LatLng);
            }}
            onClearSelection={() => {
              onClearSelection();
            }}
          />
          {/* ... */}
          <UserLocationControl 
              destination={navEnd} 
              selectedFacility={
                selectedFacility?.id === selectedId 
                  ? (selectedFacility && 'coordinates' in selectedFacility ? selectedFacility.coordinates : null) 
                  : null
              }
          />
          
          {graphData.nodes.length > 0 && graphData.edges.length > 0 && (
            <NavigationLayer 
              startPoint={navStart} 
              endPoint={navEnd} 
              mode={navMode} 
              nodes={graphData.nodes}
              edges={graphData.edges}
            />
          )}
        </MapContainerClient>

        {navEnd && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <Button 
              variant="destructive" 
              size="sm" 
              className="rounded-full shadow-lg h-8 px-4 text-xs font-semibold uppercase tracking-wider"
              onClick={() => {
                clearNavigation();
                setIsNavigatingFromUser(false);
              }}
            >
              Clear Route
            </Button>
          </div>
        )}

        {!hasResults && !error && !isLoading && hasActiveFilters && (
          <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 z-10 rounded-full bg-background/90 px-4 py-2 shadow-md backdrop-blur">
            <p className="text-sm font-medium text-foreground">No locations found.</p>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm" aria-label="Loading map">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading map and locations...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-md" role="alert">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
