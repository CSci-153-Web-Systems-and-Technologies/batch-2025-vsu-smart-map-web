"use client";

import { ChevronRight, MapPin } from "lucide-react";
import { getCategoryMeta } from "@/lib/constants/facilities";
import type { FacilityMatch } from "@/lib/types";
import { useRouter } from "next/navigation";

interface ChatFacilityCardProps {
  match: FacilityMatch;
}

export function ChatFacilityCard({ match }: ChatFacilityCardProps) {
  const { facility, matchReason } = match;
  const meta = getCategoryMeta(facility.category);
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams({ facility: facility.id });
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex w-full items-start gap-3 rounded-lg border bg-card/90 p-3 text-left transition hover:border-primary/40 hover:bg-accent"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
      >
        <MapPin className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium group-hover:text-primary">
              {facility.name}
            </h4>
            <p className="text-xs font-medium text-muted-foreground">
              {meta.label}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </div>
        {matchReason && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {matchReason}
          </p>
        )}
      </div>
    </button>
  );
}
