"use client";

import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
import type { FacilityMatch } from "@/lib/types";

interface ChatFacilityCardProps {
  match: FacilityMatch;
}

export function ChatFacilityCard({ match }: ChatFacilityCardProps) {
  const { facility, matchReason } = match;

  return (
    <Link
      href={`/directory/${facility.slug}`}
      className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Building2 className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-medium group-hover:text-primary">
            {facility.name}
          </h4>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {matchReason && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {matchReason}
          </p>
        )}
      </div>
    </Link>
  );
}
