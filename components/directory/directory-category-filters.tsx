"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FACILITY_CATEGORIES, type FacilityCategory } from "@/lib/types/facility";
import { getCategoryMeta } from "@/lib/constants/facilities";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DirectoryCategoryFiltersProps {
  selected: FacilityCategory[];
  onChange: (categories: FacilityCategory[]) => void;
  className?: string;
}

export function DirectoryCategoryFilters({
  selected,
  onChange,
  className,
}: DirectoryCategoryFiltersProps) {
  const toggleCategory = (category: FacilityCategory) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {FACILITY_CATEGORIES.map((category) => {
        const meta = getCategoryMeta(category);
        const isSelected = selected.includes(category);

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
            role="checkbox"
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

      {selected.length > 0 && (
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
