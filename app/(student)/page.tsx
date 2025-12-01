"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapContainerClient } from "@/components/map/map-container";
import { MapSearchPanel } from "@/components/map/map-search-panel";
import type { Facility } from "@/lib/types/facility";
import { getFacilities } from "@/lib/supabase/queries/facilities";
import { FacilitySheet } from "@/components/facility/facility-sheet";
import { useApp } from "@/lib/context/app-context";

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
  const { selectedFacility, selectFacility } = useApp();
  const [items, setItems] = useState<readonly Facility[]>([]);
  const [filtered, setFiltered] = useState<readonly Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error: fetchError } = await getFacilities();

      if (fetchError || !data) {
        setError("Unable to load map data. Please try again later.");
        setItems([]);
        setFiltered([]);
        setIsLoading(false);
        return;
      }

      setItems(data);
      setFiltered(data);
      setError(null);
      setIsLoading(false);
    };

    void load();
  }, []);

  const searchParams = useSearchParams();
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (hasHydrated.current) return;
    const facilityId = searchParams.get("facility");
    if (facilityId && items.length > 0) {
      const found = items.find((f) => f.id === facilityId);
      if (found) {
        selectFacility(found);
        hasHydrated.current = true;
      }
    }
  }, [searchParams, items, selectFacility]);

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

      <FacilitySheet
        facility={selectedFacility}
        open={!!selectedFacility}
        onClose={() => selectFacility(null)}
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

      {selectedId && (
        <SelectedNotice items={items} selectedId={selectedId} onClear={onClearSelection} />
      )}
    </div>
  );
}

function SelectedNotice({
  items,
  selectedId,
  onClear,
}: {
  items: readonly Facility[];
  selectedId: string;
  onClear: () => void;
}) {
  const selected = useMemo(() => items.find((m) => m.id === selectedId), [items, selectedId]);
  if (!selected) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
      <span className="text-foreground">
        Selected: <strong>{selected.name}</strong>
        {selected.code ? ` (${selected.code})` : null}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-medium text-primary underline underline-offset-2"
      >
        Clear selection
      </button>
    </div>
  );
}
