"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { StudentTabs } from "@/components/student-tabs";
import { MapContainerClient } from "@/components/map/map-container";
import { MapSearchPanel } from "@/components/map/map-search-panel";
import type { MapItem } from "@/lib/types/map";
import { getFacilities } from "@/lib/supabase/queries/facilities";

const MapSelectionLayer = dynamic(
  () => import("@/components/map/map-selection-layer").then((m) => m.MapSelectionLayer),
  { ssr: false },
);

type TabId = "map" | "directory" | "chat";

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const facilityId = searchParams.get("facility");
    if (facilityId) {
      setSelectedId(facilityId);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (tab === "directory") {
        router.push("/directory");
      } else if (tab === "chat") {
        router.push("/chat");
      }
    },
    [router]
  );

  return (
    <>
      <AppHeader
        tabsSlot={
          <StudentTabs placement="inline" activeTab="map" onTabChange={handleTabChange} />
        }
      />
      <StudentTabs placement="bottom" activeTab="map" onTabChange={handleTabChange} />
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-background px-4 py-10 md:px-6">
        <MapTab
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          onClearSelection={() => setSelectedId(null)}
        />
      </main>
    </>
  );
}

function MapTab({
  selectedId,
  onSelect,
  onClearSelection,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
}) {
  const [items, setItems] = useState<readonly MapItem[]>([]);
  const [filtered, setFiltered] = useState<readonly MapItem[]>([]);
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

      const mapItems: MapItem[] = data
        .filter((f) => f.coordinates?.lat && f.coordinates?.lng)
        .map((f) => ({
          id: f.id,
          code: f.code,
          name: f.name,
          category: f.category,
          hasRooms: f.hasRooms,
          coordinates: { lat: f.coordinates.lat, lng: f.coordinates.lng },
        }));

      setItems(mapItems);
      setFiltered(mapItems);
      setError(null);
      setIsLoading(false);
    };

    void load();
  }, []);

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
        selectedId={selectedId}
        onSelect={onSelect}
        onClearSelection={onClearSelection}
        onResultsChange={setFiltered}
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
  items: readonly MapItem[];
  filtered: readonly MapItem[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  onResultsChange: (items: MapItem[]) => void;
}) {
  const hasResults = filtered.length > 0;

  return (
    <div className="mt-4 space-y-4 md:mt-6">
      <MapSearchPanel
        items={items}
        onResultsChange={onResultsChange}
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
  items: readonly MapItem[];
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
