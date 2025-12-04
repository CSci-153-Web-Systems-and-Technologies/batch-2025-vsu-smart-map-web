"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoryMeta } from "@/lib/constants/facilities";
import type { Facility } from "@/lib/types/facility";
import { MapPin, Info } from "lucide-react";

interface MapSelectionCardProps {
  facility: Facility;
  onClear: () => void;
  onViewDetails: () => void;
}

export function MapSelectionCard({ facility, onClear, onViewDetails }: MapSelectionCardProps) {
  const meta = getCategoryMeta(facility.category);

  return (
    <Card className="border bg-white shadow-card dark:bg-card">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted"
            style={{ borderColor: meta.color }}
          >
            <MapPin className="h-5 w-5" style={{ color: meta.color }} aria-hidden />
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {facility.name}
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: meta.color }}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {facility.code ? `Code: ${facility.code}` : "No code"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
          <Button size="sm" className="gap-2" onClick={onViewDetails}>
            <Info className="h-4 w-4" />
            Show more info
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
