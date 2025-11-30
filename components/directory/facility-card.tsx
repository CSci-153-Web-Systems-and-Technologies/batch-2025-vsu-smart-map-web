"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryMeta } from "@/lib/constants/facilities";
import type { Facility } from "@/lib/types/facility";
import { cn } from "@/lib/utils";

export interface FacilityCardProps {
  /** The facility data to display */
  facility: Facility;
  /** Callback when the card is clicked */
  onClick?: (facility: Facility) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FacilityCard displays a single facility in the directory.
 * 
 * - Buildings (hasRooms: true) show a hero image
 * - POIs (hasRooms: false) show a category icon
 * - All cards display the facility name and a colored category badge
 */
export function FacilityCard({ facility, onClick, className }: FacilityCardProps) {
  const meta = getCategoryMeta(facility.category);
  
  const handleClick = () => {
    onClick?.(facility);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(facility);
    }
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
      {/* Image/Icon Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {facility.hasRooms && facility.imageUrl ? (
          // Building with hero image
          <Image
            src={facility.imageUrl}
            alt={facility.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          // POI or building without image - show category icon
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

      {/* Content Section */}
      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-tight text-foreground">
          {facility.name}
        </h3>
        
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
      </CardContent>
    </Card>
  );
}
