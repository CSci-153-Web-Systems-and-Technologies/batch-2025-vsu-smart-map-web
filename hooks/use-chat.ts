"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, ChatState, FacilityMatch } from "@/lib/types";

function createMessageId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString();
}

interface UseChatOptions {
  streaming?: boolean;
}

export function useChat({ streaming = false }: UseChatOptions = {}) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const assistantId = createMessageId();

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
          body: JSON.stringify({ message: trimmed, history, streaming }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        if (streaming && res.body) {
          setState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: assistantId,
                role: "assistant",
                content: "",
                timestamp: new Date(),
              },
            ],
          }));

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data) as string | { error: string };
                  if (typeof parsed === "string") {
                    fullContent += parsed;
                    setState((prev) => ({
                      ...prev,
                      messages: prev.messages.map((m) =>
                        m.id === assistantId ? { ...m, content: fullContent } : m
                      ),
                    }));
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }

          setState((prev) => ({ ...prev, isLoading: false }));
        } else {
          const data = (await res.json()) as {
            content: string;
            facilities?: FacilityMatch[];
            followUp?: string | null;
          };

          const assistantMessage: ChatMessage = {
            id: assistantId,
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
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";

        const errorAssistant: ChatMessage = {
          id: assistantId,
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
    [state.messages, streaming]
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
