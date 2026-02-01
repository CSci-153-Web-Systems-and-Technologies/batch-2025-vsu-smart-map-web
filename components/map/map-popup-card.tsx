"use client";

import { Button } from "@/components/ui/button";
import { getCategoryMeta } from "@/lib/constants/facilities";
import type { Facility } from "@/lib/types/facility";
import { Info, Route } from "lucide-react";
import Image from "next/image";

interface MapPopupCardProps {
  facility: Facility;
  onViewDetails: () => void;
  onDirections?: () => void; // New prop
}

export function MapPopupCard({ facility, onViewDetails, onDirections }: MapPopupCardProps) {
  const meta = getCategoryMeta(facility.category);

  return (
    <div className="flex flex-col gap-3 min-w-[200px] max-w-[240px] p-3">
      <div className="flex items-start gap-3">
        {facility.imageUrl && (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={facility.imageUrl}
              alt={facility.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
            {facility.name}
          </h3>
          <span
            className="inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2 h-8 text-xs"
          onClick={onViewDetails}
        >
          <Info className="h-3 w-3" aria-hidden />
          Details
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-2 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onDirections}
        >
          <Route className="h-3 w-3" aria-hidden />
          Navigate
        </Button>
      </div>
    </div>
  );
}
