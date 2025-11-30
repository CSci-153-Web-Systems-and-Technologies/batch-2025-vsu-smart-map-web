"use client";

import { useMemo } from "react";
import { FacilityCard } from "./facility-card";
import { getCategoryMeta } from "@/lib/constants/facilities";
import type { Facility, FacilityCategory } from "@/lib/types/facility";
import { FACILITY_CATEGORIES } from "@/lib/types/facility";
import { cn } from "@/lib/utils";

export interface DirectoryListProps {
  /** Array of facilities to display */
  facilities: Facility[];
  /** Callback when a facility card is clicked */
  onFacilityClick?: (facility: Facility) => void;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Groups facilities by their category.
 * Returns a Map to preserve insertion order based on FACILITY_CATEGORIES.
 */
function groupFacilitiesByCategory(
  facilities: Facility[]
): Map<FacilityCategory, Facility[]> {
  // Initialize map with category order from FACILITY_CATEGORIES
  const grouped = new Map<FacilityCategory, Facility[]>();
  
  // Only add categories that have facilities
  for (const facility of facilities) {
    const existing = grouped.get(facility.category);
    if (existing) {
      existing.push(facility);
    } else {
      grouped.set(facility.category, [facility]);
    }
  }

  // Sort map entries by FACILITY_CATEGORIES order
  const orderedEntries = [...grouped.entries()].sort((a, b) => {
    const indexA = FACILITY_CATEGORIES.indexOf(a[0]);
    const indexB = FACILITY_CATEGORIES.indexOf(b[0]);
    return indexA - indexB;
  });

  return new Map(orderedEntries);
}

/**
 * DirectoryList displays all facilities grouped by category.
 * 
 * Features:
 * - Groups facilities by category with section headings
 * - Responsive grid: 1 column mobile, 2 tablet, 3-4 desktop
 * - Empty state when no facilities
 */
export function DirectoryList({
  facilities,
  onFacilityClick,
  className,
}: DirectoryListProps) {
  const groupedFacilities = useMemo(
    () => groupFacilitiesByCategory(facilities),
    [facilities]
  );

  if (facilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">No facilities found.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {[...groupedFacilities.entries()].map(([category, categoryFacilities]) => {
        const meta = getCategoryMeta(category);
        
        return (
          <section key={category} aria-labelledby={`category-${category}`}>
            {/* Category Heading */}
            <div className="mb-4 flex items-center gap-2">
              <h2
                id={`category-${category}`}
                className="text-xl font-bold text-foreground"
              >
                {meta.label}
              </h2>
              <span className="text-sm text-muted-foreground">
                ({categoryFacilities.length})
              </span>
            </div>

            {/* Facility Grid */}
            <div
              className={cn(
                "grid gap-4",
                "grid-cols-1",           // Mobile: 1 column
                "sm:grid-cols-2",        // Tablet: 2 columns
                "lg:grid-cols-3",        // Desktop: 3 columns
                "xl:grid-cols-4"         // Large desktop: 4 columns
              )}
            >
              {categoryFacilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  onClick={onFacilityClick}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
