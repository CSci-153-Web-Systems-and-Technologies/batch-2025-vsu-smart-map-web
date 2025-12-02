import type { Facility } from "./facility";

export type MessageRole = "user" | "assistant";

export interface FacilityMatch {
  facility: Facility;
  matchReason: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  facilities?: FacilityMatch[];
  isError?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
