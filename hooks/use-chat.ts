"use client";

import { useCallback, useState } from "react";
import type { ChatMessage, ChatState, FacilityMatch } from "@/lib/types";

function createMessageId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString();
}

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const history = state.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const data = (await res.json()) as {
          content: string;
          facilities?: FacilityMatch[];
          followUp?: string | null;
        };

        const assistantMessage: ChatMessage = {
          id: createMessageId(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
          facilities: data.facilities,
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";

        const errorAssistant: ChatMessage = {
          id: createMessageId(),
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
          isError: true,
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorAssistant],
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    [state.messages]
  );

  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
    });
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessage) return;
    void sendMessage(lastUserMessage.content);
  }, [state.messages, sendMessage]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}
