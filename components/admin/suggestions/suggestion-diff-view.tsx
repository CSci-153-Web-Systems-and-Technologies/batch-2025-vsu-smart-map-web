"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Facility } from "@/lib/types/facility";
import type { Suggestion } from "@/lib/types/suggestion";
import type { UnifiedFacilityFormValues } from "@/lib/validation/facility";
import { cn } from "@/lib/utils";
import { approveSuggestion, rejectSuggestion } from "@/app/admin/suggestions/actions";
import { FacilityDialog } from "@/components/admin/facility-dialog";
import { uploadFacilityHeroClient } from "@/lib/supabase/storage-client";
import { Pencil } from "lucide-react";

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

  const [editedPayload, setEditedPayload] = useState<Partial<UnifiedFacilityFormValues>>(payload);
  const [isEditing, setIsEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const disabled = pending || suggestion.status !== "PENDING";

  const handleApprove = () => {
    setError(null);
    setMessage(null);

    const confirmed = window.confirm(
      "Approve this suggestion? This will update the live data immediately.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await approveSuggestion(suggestion.id, editedPayload);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Suggestion approved and applied.");
      router.refresh();
    });
  };

  const handleReject = () => {
    setError(null);
    setMessage(null);

    const reason = window.prompt("Optional: add a rejection note for the submitter.");
    startTransition(async () => {
      const result = await rejectSuggestion(suggestion.id, reason ?? undefined);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Suggestion rejected.");
      router.refresh();
    });
  };

  const handleEditSubmit = async (
    values: UnifiedFacilityFormValues,
    options?: { file?: File | null; clearImage?: boolean },
  ) => {
    let imageUrl = values.imageUrl ?? editedPayload.imageUrl;

    if (options?.file) {
      const tempId = crypto.randomUUID();
      const upload = await uploadFacilityHeroClient(tempId, options.file, options.file.name);
      if (upload.error) {
        setError(upload.error.message);
        return;
      }
      imageUrl = upload.data?.publicUrl ?? imageUrl;
    } else if (options?.clearImage) {
      imageUrl = undefined;
    }

    setEditedPayload({ ...values, imageUrl });
    setIsEditing(false);
  };

  const dialogFacility = {
    ...currentFacility,
    ...editedPayload,
    id: currentFacility?.id ?? "temp-id",
    createdAt: currentFacility?.createdAt ?? new Date().toISOString(),
    updatedAt: currentFacility?.updatedAt ?? new Date().toISOString(),
  } as unknown as Facility;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">{suggestion.type.replace("_", " ")}</Badge>
        <Badge variant="secondary">{suggestion.status}</Badge>
        <span className="text-sm text-muted-foreground">
          Submitted {new Date(suggestion.createdAt).toLocaleString()}
        </span>
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

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
            {suggestion.status === "PENDING" && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {(Object.keys(fieldLabels) as FieldKey[]).map((key) => {
              const changed = hasDifference(key, currentValues, editedPayload);
              const value = editedPayload[key];

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

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleApprove} disabled={disabled}>
          {pending ? "Working..." : "Approve"}
        </Button>
        <Button onClick={handleReject} disabled={disabled} variant="outline">
          Reject
        </Button>
      </div>

      <FacilityDialog
        open={isEditing}
        mode={suggestion.type === "ADD_FACILITY" ? "create" : "edit"}
        facility={dialogFacility}
        onOpenChange={setIsEditing}
        onSubmit={handleEditSubmit}
        title="Edit Suggestion"
        description="Modify the proposed details before approving."
        submitLabel="Update Proposal"
      />
    </div>
  );
}
