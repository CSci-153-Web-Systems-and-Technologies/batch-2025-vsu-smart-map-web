"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainerClient } from "@/components/map/map-container";
import { MapSearchPanel } from "@/components/map/map-search-panel";
import { MapSelectionCard } from "@/components/map/selection-card";
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
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-background px-4 py-10 md:px-6">
      <MapTab />
    </main>
  );
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
      className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6"
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Map</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Explore the campus map</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setSuggestOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Submit a location
        </Button>
      </div>

      <MapView
        items={items}
        filtered={filtered}
        isLoading={isLoading}
        error={error}
        selectedId={selectedFacility?.id ?? null}
        onSelect={(id) => {
          const facility = items.find((f) => f.id === id) || null;
          selectFacility(facility);
        }}
        onClearSelection={() => selectFacility(null)}
        onResultsChange={(results) => setFiltered(results as Facility[])}
      />

      <SuggestAddModal
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        onSuccess={() => setSuggestOpen(false)}
      />
    </section>
  );
}

function MapView({
  items,
  filtered,
  isLoading,
  error,
  selectedId,
  onSelect,
  onClearSelection,
  onResultsChange,
}: {
  items: readonly Facility[];
  filtered: readonly Facility[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  onResultsChange: (items: Facility[]) => void;
}) {
  const router = useRouter();
  const { selectedFacility } = useApp();
  const hasResults = filtered.length > 0;

  return (
    <div className="mt-4 space-y-4 md:mt-6">
      <MapSearchPanel
        items={items}
        onResultsChange={(results) => onResultsChange(results as Facility[])}
      />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <div
          className="h-[420px] md:h-[560px] rounded-xl border border-border bg-muted animate-pulse"
          aria-label="Loading map"
        />
      ) : (
        <div className="relative h-[420px] md:h-[560px] rounded-xl border border-border overflow-hidden">
          <MapContainerClient className="h-full w-full">
            <MapSelectionLayer
              items={filtered}
              selectedId={selectedId}
              onSelect={(item) => onSelect(item.id)}
            />
          </MapContainerClient>
          {!hasResults && !error && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-muted/30 text-center">
              <p className="text-sm font-medium text-foreground">No locations match your search.</p>
              <p className="mt-1 text-xs text-muted-foreground">Try clearing filters or another term.</p>
            </div>
          )}
        </div>
      )}

      {selectedFacility && (
        <MapSelectionCard
          facility={selectedFacility}
          onClear={onClearSelection}
          onViewDetails={() => router.push(`/directory?facility=${selectedFacility.id}`)}
        />
      )}
    </div>
  );
}
