"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StudentTabs } from "@/components/student-tabs";
import { MapContainerClient } from "@/components/map/map-container";
import { MapSearchPanel } from "@/components/map/map-search-panel";
import { MapSelectionLayer } from "@/components/map/map-selection-layer";
import type { MapMarkerPayload } from "@/lib/types/building";
import { getBuildings } from "@/lib/supabase/queries/buildings";

type TabId = "map" | "directory" | "chat";

const TAB_CONTENT: Record<TabId, { title: string; body: string }> = {
  directory: {
    title: "Browse the directory",
    body: "Soon: searchable building list with categories, rooms, and details.",
  },
  chat: {
    title: "Ask the assistant",
    body: "Soon: chat with Gemini to find locations and highlight them on the map.",
  },
  map: {
    title: "Explore the campus map",
    body: "Interactive Leaflet map with category pins and selection highlight.",
  },
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("map");

  return (
    <>
      <AppHeader
        tabsSlot={
          <StudentTabs placement="inline" activeTab={activeTab} onTabChange={setActiveTab} />
        }
      />
      <StudentTabs placement="bottom" activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-background px-4 py-10 md:px-6">
        {activeTab === "map" ? <MapTab /> : <PlaceholderTab tab={activeTab} />}
      </main>
    </>
  );
}

function PlaceholderTab({ tab }: { tab: Exclude<TabId, "map"> }) {
  const content = TAB_CONTENT[tab];

  return (
    <section
      id={`${tab}-panel`}
      role="tabpanel"
      aria-label={`${tab} panel`}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
      tabIndex={0}
    >
      <p className="text-sm uppercase tracking-wide text-muted-foreground">
        {tab === "directory" && "Directory"}
        {tab === "chat" && "Chat"}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">{content.title}</h1>
      <p className="mt-3 text-base text-muted-foreground">{content.body}</p>
    </section>
  );
}

function MapTab() {
  const [markers, setMarkers] = useState<readonly MapMarkerPayload[]>([]);
  const [filtered, setFiltered] = useState<readonly MapMarkerPayload[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error: fetchError } = await getBuildings();
      if (fetchError) {
        setError("Unable to load buildings. Please try again later.");
        setMarkers([]);
        setFiltered([]);
      } else if (data) {
        const mapped = data
          .filter((b) => b.lat && b.lng)
          .map<MapMarkerPayload>((b) => ({
            id: b.id,
            code: b.code,
            name: b.name,
            category: b.category,
            coordinates: { lat: b.lat, lng: b.lng },
          }));
        setMarkers(mapped);
        setFiltered(mapped);
        setError(null);
      }
      setIsLoading(false);
    };

    void load();
  }, []);

  const hasResults = filtered.length > 0;

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

      <div className="mt-4 space-y-4 md:mt-6">
        <MapSearchPanel markers={markers} onResultsChange={setFiltered} />

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
        ) : hasResults ? (
          <div className="h-[420px] md:h-[560px] rounded-xl border border-border overflow-hidden">
            <MapContainerClient className="h-full w-full">
              <MapSelectionLayer
                markers={filtered}
                selectedId={selectedId}
                onSelect={(marker) => setSelectedId(marker.id)}
              />
            </MapContainerClient>
          </div>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center">
            <p className="text-sm font-medium text-foreground">No buildings match your search.</p>
            <p className="mt-1 text-xs text-muted-foreground">Try clearing filters or another term.</p>
          </div>
        )}

        {selectedId && (
          <SelectedNotice markers={markers} selectedId={selectedId} onClear={() => setSelectedId(null)} />
        )}
      </div>
    </section>
  );
}

function SelectedNotice({
  markers,
  selectedId,
  onClear,
}: {
  markers: readonly MapMarkerPayload[];
  selectedId: string;
  onClear: () => void;
}) {
  const selected = useMemo(() => markers.find((m) => m.id === selectedId), [markers, selectedId]);
  if (!selected) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
      <span className="text-foreground">
        Selected: <strong>{selected.name}</strong> ({selected.code})
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
