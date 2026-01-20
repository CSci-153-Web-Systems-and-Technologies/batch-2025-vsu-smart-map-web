"use client";

import { FACILITY_CATEGORIES, type FacilityCategory } from "@/lib/types/facility";
import { FACILITY_CATEGORY_META } from "@/lib/constants/facilities";

type CategoryFiltersProps = {
  value: FacilityCategory[];
  onChange: (value: FacilityCategory[]) => void;
  onToggle: (value: FacilityCategory) => void;
};

export function CategoryFilters({ value, onChange, onToggle }: CategoryFiltersProps) {
  const isAllSelected = value.length === FACILITY_CATEGORIES.length;
  const isNoneSelected = value.length === 0;

  return (
    <div className="w-full">
      <div
        role="radiogroup"
        aria-label="Filter by category"
        className="flex items-center overflow-x-auto gap-2 no-scrollbar"
      >
        <button
          type="button"
          onClick={() => onChange([...FACILITY_CATEGORIES])}
          className={`flex-none rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${isAllSelected
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          Select All
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className={`flex-none rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${isNoneSelected
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          Clear All
        </button>
        {FACILITY_CATEGORIES.map((cat) => {
          const meta = FACILITY_CATEGORY_META[cat];
          const isActive = value.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              role="checkbox"
              aria-checked={isActive}
              onClick={() => onToggle(cat)}
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