"use client";

import type { FacilityMatch } from "@/lib/types";
import { ChatFacilityCard } from "./chat-facility-card";

interface ChatFacilityCardsProps {
  matches: FacilityMatch[];
}

export function ChatFacilityCards({ matches }: ChatFacilityCardsProps) {
  if (!matches.length) return null;

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {matches.map((match) => (
        <ChatFacilityCard key={match.facility.id} match={match} />
      ))}
    </div>
  );
}
