"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { MapContainerClient } from "@/components/map/map-container";
import { MapSearchPanel } from "@/components/map/map-search-panel";
import type { Facility } from "@/lib/types/facility";
import { getFacilities } from "@/lib/supabase/queries/facilities";
import { useApp } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SuggestAddModal } from "@/components/suggestions/suggest-add-modal";
import { getCachedFacilities, setCachedFacilities } from "@/lib/cache/facilities-cache";

const MapSelectionLayer = dynamic(
  () => import("@/components/map/map-selection-layer").then((m) => m.MapSelectionLayer),
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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      const cached = getCachedFacilities();
      if (cached && cached.length > 0) {
        setItems(cached);
        setFiltered(cached);
      }

      const { data, error: fetchError } = await getFacilities();

      if (fetchError || !data) {
        if (cached && cached.length > 0) {
          setError(null);
        } else {
          setError("Unable to load map data. Please try again later.");
          setItems([]);
          setFiltered([]);
        }
        setIsLoading(false);
        return;
      }

      setCachedFacilities(data as Facility[]);
      setItems(data);
      setFiltered(data);
      setError(null);
      setIsLoading(false);
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
      <div className="w-full border-b bg-background/95 backdrop-blur z-20 px-4 py-1.5 shrink-0">
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
          onSelect={(id) => {
            const facility = items.find((f) => f.id === id) || null;
            selectFacility(facility);
          }}
          onClearSelection={() => selectFacility(null)}
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

function MapView({
  filtered,
  isLoading,
  error,
  selectedId,
  onSelect,
  onClearSelection,
}: {
  filtered: readonly Facility[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
}) {
  const hasResults = filtered.length > 0;

  return (
    <div className="relative h-full w-full">


      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <p className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-md" role="alert">
            {error}
          </p>
        </div>
      )}

      {isLoading ? (
        <div
          className="h-full w-full bg-muted animate-pulse"
          aria-label="Loading map"
        />
      ) : (
        <div className="relative h-full w-full overflow-hidden">
          <MapContainerClient className="h-full w-full">
            <MapSelectionLayer
              items={filtered}
              selectedId={selectedId}
              onSelect={(item) => onSelect(item.id)}
              onClearSelection={onClearSelection}
            />
          </MapContainerClient>
          {!hasResults && !error && (
            <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 z-10 rounded-full bg-background/90 px-4 py-2 shadow-md backdrop-blur">
              <p className="text-sm font-medium text-foreground">No locations found.</p>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
