"use client";

import { BUILDING_CATEGORIES, BUILDING_CATEGORY_META, type BuildingCategory } from "@/lib/constants/buildings";

type CategoryFiltersProps = {
  value: BuildingCategory | null;
  onChange: (value: BuildingCategory | null) => void;
};

export function CategoryFilters({ value, onChange }: CategoryFiltersProps) {
  return (
    <div role="radiogroup" aria-label="Filter by category" className="flex flex-wrap gap-2">
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        onClick={() => onChange(null)}
        className={`rounded-full border px-3 py-1 text-sm ${
          value === null ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
        }`}
      >
        All
      </button>
      {BUILDING_CATEGORIES.map((cat) => {
        const meta = BUILDING_CATEGORY_META[cat];
        const isActive = value === cat;
        return (
          <button
            key={cat}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(isActive ? null : cat)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              isActive
                ? "border-transparent text-white"
                : "border-border text-foreground hover:border-muted-foreground/60"
            }`}
            style={isActive ? { backgroundColor: meta.color } : undefined}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}