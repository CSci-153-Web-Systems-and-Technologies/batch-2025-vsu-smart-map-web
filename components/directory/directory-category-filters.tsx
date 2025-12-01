"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FACILITY_CATEGORIES, type FacilityCategory } from "@/lib/types/facility";
import { getCategoryMeta } from "@/lib/constants/facilities";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DirectoryCategoryFiltersProps {
  selected: FacilityCategory | null;
  onChange: (category: FacilityCategory | null) => void;
  className?: string;
}

export function DirectoryCategoryFilters({
  selected,
  onChange,
  className,
}: DirectoryCategoryFiltersProps) {
  const toggleCategory = (category: FacilityCategory) => {
    if (selected === category) {
      onChange(null);
    } else {
      onChange(category);
    }
  };

  const clearAll = () => onChange(null);

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="radiogroup"
      aria-label="Filter by category"
    >
      <Badge
        variant={selected === null ? "default" : "outline"}
        className={cn(
          "cursor-pointer transition-colors",
          selected === null && "ring-2 ring-offset-1"
        )}
        onClick={() => onChange(null)}
        role="radio"
        aria-checked={selected === null}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onChange(null);
          }
        }}
      >
        All
      </Badge>

      {FACILITY_CATEGORIES.map((category) => {
        const meta = getCategoryMeta(category);
        const isSelected = selected === category;

        return (
          <Badge
            key={category}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              isSelected && "ring-2 ring-offset-1"
            )}
            style={
              isSelected
                ? {
                  backgroundColor: meta.color,
                  borderColor: meta.color,
                  color: "#ffffff",
                }
                : undefined
            }
            onClick={() => toggleCategory(category)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleCategory(category);
              }
            }}
          >
            {meta.label}
          </Badge>
        );
      })}

      {selected !== null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-6 gap-1 px-2 text-xs"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
