"use client";

import { FACILITY_CATEGORIES, type FacilityCategory } from "@/lib/types/facility";
import { FACILITY_CATEGORY_META } from "@/lib/constants/facilities";

type CategoryFiltersProps = {
  value: FacilityCategory | null;
  onChange: (value: FacilityCategory | null) => void;
};

export function CategoryFilters({ value, onChange }: CategoryFiltersProps) {
  return (
    <div className="relative group">
      <div
        role="radiogroup"
        aria-label="Filter by category"
        className="flex overflow-x-auto pb-1 -mx-1 px-1 gap-2 no-scrollbar mask-gradient-right"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          onClick={() => onChange(null)}
          className={`flex-none rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${value === null
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          All
        </button>
        {FACILITY_CATEGORIES.map((cat) => {
          const meta = FACILITY_CATEGORY_META[cat];
          const isActive = value === cat;
          return (
            <button
              key={cat}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(isActive ? null : cat)}
              className={`flex-none inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${isActive
                ? "border-transparent text-white shadow-sm ring-1 ring-black/5"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              style={isActive ? { backgroundColor: meta.color } : undefined}
            >
              {!isActive && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden="true"
                />
              )}
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}