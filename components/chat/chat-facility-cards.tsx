"use client";

import type { FacilityMatch } from "@/lib/types";
import { ChatFacilityCard } from "./chat-facility-card";

interface ChatFacilityCardsProps {
  matches: FacilityMatch[];
}

export function ChatFacilityCards({ matches }: ChatFacilityCardsProps) {
  if (!matches.length) return null;

  return (
    <div className="mt-2 space-y-2 rounded-lg bg-muted/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Found {matches.length} location{matches.length > 1 ? "s" : ""}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {matches.map((match) => (
          <ChatFacilityCard key={match.facility.id} match={match} />
        ))}
      </div>
    </div>
  );
}
