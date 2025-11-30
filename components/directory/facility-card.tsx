"use client";

import Image from "next/image";
import { MapPinned } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryMeta } from "@/lib/constants/facilities";
import type { Facility } from "@/lib/types/facility";
import { cn } from "@/lib/utils";

export interface FacilityCardProps {
  facility: Facility;
  onClick?: (facility: Facility) => void;
  onViewOnMap?: (facility: Facility) => void;
  className?: string;
}

export function FacilityCard({ facility, onClick, onViewOnMap, className }: FacilityCardProps) {
  const meta = getCategoryMeta(facility.category);
  const hasCoordinates = facility.coordinates?.lat && facility.coordinates?.lng;
  
  const handleClick = () => {
    onClick?.(facility);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(facility);
    }
  };

  const handleViewOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewOnMap?.(facility);
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${facility.name}`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {facility.hasRooms && facility.imageUrl ? (
          <Image
            src={facility.imageUrl}
            alt={facility.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Image
              src={meta.pinAsset}
              alt={meta.label}
              width={48}
              height={48}
              className="opacity-60 transition-opacity group-hover:opacity-80"
            />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-tight text-foreground">
          {facility.name}
        </h3>
        
        <div className="flex items-center justify-between gap-2">
          <Badge
            className="text-xs"
            style={{ 
              backgroundColor: meta.color,
              color: "#ffffff",
              borderColor: meta.color 
            }}
          >
            {meta.label}
          </Badge>

          {hasCoordinates && onViewOnMap && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleViewOnMap}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              aria-label={`View ${facility.name} on map`}
            >
              <MapPinned className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Map</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
