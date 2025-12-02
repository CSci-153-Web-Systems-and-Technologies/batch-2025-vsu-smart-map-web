import { CHAT_HISTORY } from "@/lib/constants/chat";
import type { ChatMessage } from "@/lib/types";

interface TruncationResult {
  messages: ChatMessage[];
  wasTriuncated: boolean;
  removedCount: number;
}

export function truncateHistory(
  messages: ChatMessage[],
  maxMessages = CHAT_HISTORY.MAX_MESSAGES
): TruncationResult {
  if (messages.length <= maxMessages) {
    return {
      messages,
      wasTriuncated: false,
      removedCount: 0,
    };
  }

  const removedCount = messages.length - maxMessages;
  const truncated = messages.slice(-maxMessages);

  return {
    messages: truncated,
    wasTriuncated: true,
    removedCount,
  };
}

export function prepareHistoryForContext(
  messages: ChatMessage[],
  maxContextMessages = CHAT_HISTORY.MAX_CONTEXT_MESSAGES
): Array<{ role: "user" | "assistant"; content: string }> {
  const recentMessages = messages.slice(-maxContextMessages);

  return recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

export function estimateTokenCount(messages: ChatMessage[]): number {
  return messages.reduce((total, m) => {
    const wordCount = m.content.split(/\s+/).length;
    return total + Math.ceil(wordCount * 1.3);
  }, 0);
}

export function shouldSummarize(messages: ChatMessage[]): boolean {
  return messages.length >= CHAT_HISTORY.SUMMARY_THRESHOLD;
}
