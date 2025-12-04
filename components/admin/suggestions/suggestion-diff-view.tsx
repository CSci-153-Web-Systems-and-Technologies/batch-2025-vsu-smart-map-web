"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Facility } from "@/lib/types/facility";
import type { Suggestion } from "@/lib/types/suggestion";
import type { UnifiedFacilityFormValues } from "@/lib/validation/facility";
import { cn } from "@/lib/utils";

interface SuggestionDiffViewProps {
  suggestion: Suggestion;
  payload: Partial<UnifiedFacilityFormValues>;
  currentFacility: Facility | null;
}

type FieldKey = keyof Pick<
  UnifiedFacilityFormValues,
  "name" | "code" | "description" | "category" | "hasRooms" | "coordinates" | "imageUrl"
>;

const fieldLabels: Record<FieldKey, string> = {
  name: "Name",
  code: "Code",
  description: "Description",
  category: "Category",
  hasRooms: "Has Rooms",
  coordinates: "Coordinates",
  imageUrl: "Image",
};

const formatValue = (key: FieldKey, value: unknown) => {
  if (value === undefined || value === null) return "—";
  if (key === "hasRooms") return value ? "Building (has rooms)" : "POI (no rooms)";
  if (key === "coordinates" && typeof value === "object" && value) {
    const coords = value as { lat?: number; lng?: number };
    return coords.lat !== undefined && coords.lng !== undefined
      ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
      : "—";
  }
  return String(value);
};

const hasDifference = (
  key: FieldKey,
  currentValues: Partial<UnifiedFacilityFormValues> | null,
  payload: Partial<UnifiedFacilityFormValues>,
) => {
  if (!currentValues) return true;
  const nextValue = payload[key];
  if (nextValue === undefined) return false;

  const currentValue = currentValues[key];

  if (key === "coordinates") {
    const currentCoords = currentValue as { lat?: number; lng?: number } | undefined;
    const nextCoords = nextValue as { lat?: number; lng?: number } | undefined;
    if (!currentCoords || !nextCoords) return !!nextCoords;
    return (
      currentCoords.lat?.toFixed(5) !== nextCoords.lat?.toFixed(5) ||
      currentCoords.lng?.toFixed(5) !== nextCoords.lng?.toFixed(5)
    );
  }

  return JSON.stringify(currentValue) !== JSON.stringify(nextValue);
};

export function SuggestionDiffView({ suggestion, payload, currentFacility }: SuggestionDiffViewProps) {
  const currentValues: Partial<UnifiedFacilityFormValues> | null = currentFacility
    ? {
      code: currentFacility.code ?? "",
      name: currentFacility.name,
      description: currentFacility.description ?? "",
      category: currentFacility.category,
      hasRooms: currentFacility.hasRooms,
      coordinates: currentFacility.coordinates,
      imageUrl: currentFacility.imageUrl ?? "",
      slug: currentFacility.slug,
    }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">{suggestion.type.replace("_", " ")}</Badge>
        <Badge variant="secondary">{suggestion.status}</Badge>
        <span className="text-sm text-muted-foreground">
          Submitted {new Date(suggestion.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Current
            </h3>
          </div>
          {currentValues ? (
            <div className="space-y-3">
              {(Object.keys(fieldLabels) as FieldKey[]).map((key) => (
                <div key={key} className="space-y-1 rounded-md border border-border/60 bg-background px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">{fieldLabels[key]}</p>
                  {key === "imageUrl" && currentValues.imageUrl ? (
                    <div className="relative h-32 w-full overflow-hidden rounded-md border">
                      <Image
                        src={currentValues.imageUrl}
                        alt="Current image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-foreground">{formatValue(key, currentValues[key])}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No existing record. This will create a new facility if approved.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/10 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Proposed
            </h3>
          </div>

          <div className="space-y-3">
            {(Object.keys(fieldLabels) as FieldKey[]).map((key) => {
              const changed = hasDifference(key, currentValues, payload);
              const value = payload[key];

              return (
                <div
                  key={key}
                  className={cn(
                    "space-y-1 rounded-md border px-3 py-2",
                    changed ? "border-primary/60 bg-primary/5" : "border-border/60 bg-background"
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">{fieldLabels[key]}</p>
                  {key === "imageUrl" && typeof value === "string" && value ? (
                    <div className="relative h-32 w-full overflow-hidden rounded-md border">
                      <Image
                        src={value}
                        alt="Proposed image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-foreground">{formatValue(key, value)}</p>
                  )}
                  {changed && currentValues && (
                    <p className="text-xs text-primary">
                      Updated from {formatValue(key, currentValues[key])}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
