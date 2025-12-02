"use client";

import { useCallback, useRef, useState } from "react";
import { prepareHistoryForContext, truncateHistory } from "@/lib/ai/history";
import type { ChatMessage, ChatState, FacilityMatch } from "@/lib/types";

function createMessageId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function applyTruncation(messages: ChatMessage[]) {
  return truncateHistory(messages).messages;
}

interface UseChatOptions {
  streaming?: boolean;
}

export function useChat({ streaming = true }: UseChatOptions = {}) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeRequest = useCallback(
    async (
      content: string,
      baseMessages: ChatMessage[],
      userMessage: ChatMessage
    ) => {
      const assistantId = createMessageId();
      const messagesWithUser = applyTruncation([...baseMessages, userMessage]);
      const history = prepareHistoryForContext(baseMessages);

      setState({
        messages: messagesWithUser,
        isLoading: true,
        error: null,
      });

      const addAssistantPlaceholder = () =>
        setState((prev) => ({
          ...prev,
          messages: applyTruncation([
            ...prev.messages,
            {
              id: assistantId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
            },
          ]),
        }));

      const updateAssistantMessage = (
        updater: (message: ChatMessage) => ChatMessage
      ) =>
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((message) =>
            message.id === assistantId ? updater(message) : message
          ),
        }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history, streaming }),
          signal: abortControllerRef.current!.signal,
        });

        if (!res.ok) {
          const maybeError = await res.json().catch(() => null);
          const message = maybeError?.error || `Request failed: ${res.status}`;
          throw new Error(message);
        }

        if (streaming && res.body) {
          addAssistantPlaceholder();

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let fullContent = "";
          let facilities: FacilityMatch[] | undefined;
          let followUp: string | null = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const event of events) {
              const line = event.trim();
              if (!line.startsWith("data:")) continue;

              const payloadRaw = line.slice(5).trim();
              if (!payloadRaw || payloadRaw === "[DONE]") continue;

              let payload: unknown;
              try {
                payload = JSON.parse(payloadRaw);
              } catch {
                continue;
              }

              if (!payload || typeof payload !== "object") continue;
              const type = (payload as { type?: string }).type;

              if (
                type === "chunk" &&
                typeof (payload as { content?: unknown }).content === "string"
              ) {
                fullContent += (payload as { content: string }).content;
                updateAssistantMessage((message) => ({
                  ...message,
                  content: fullContent,
                }));
              } else if (type === "final") {
                const finalContent =
                  typeof (payload as { content?: unknown }).content === "string"
                    ? (payload as { content: string }).content
                    : fullContent;

                const maybeFacilities = (payload as {
                  facilities?: FacilityMatch[];
                }).facilities;
                facilities = Array.isArray(maybeFacilities)
                  ? maybeFacilities
                  : undefined;

                const maybeFollowUp = (payload as { followUp?: unknown })
                  .followUp;
                followUp =
                  typeof maybeFollowUp === "string" && maybeFollowUp.trim()
                    ? maybeFollowUp
                    : null;

                updateAssistantMessage((message) => ({
                  ...message,
                  content: finalContent,
                  facilities,
                  followUp,
                }));
              } else if (
                type === "error" &&
                (payload as { error?: unknown }).error
              ) {
                const message =
                  typeof (payload as { error?: unknown }).error === "string"
                    ? (payload as { error: string }).error
                    : "Chat failed";
                throw new Error(message);
              }
            }
          }

          setState((prev) => ({
            ...prev,
            isLoading: false,
            messages: prev.messages.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: fullContent || message.content,
                    facilities,
                    followUp,
                  }
                : message
            ),
          }));
          return;
        }

        const data = (await res.json()) as {
          content?: string;
          facilities?: FacilityMatch[];
          followUp?: string | null;
          error?: string;
        };

        if (data.error) {
          throw new Error(data.error);
        }

        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: data.content || "No response",
          timestamp: new Date(),
          facilities: data.facilities,
          followUp: data.followUp ?? null,
        };

        setState((prev) => ({
          ...prev,
          messages: applyTruncation([...prev.messages, assistantMessage]),
          isLoading: false,
        }));
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
          messages: applyTruncation([...prev.messages, errorAssistant]),
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    [streaming]
  );

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

      await executeRequest(trimmed, state.messages, userMessage);
    },
    [state.messages, executeRequest]
  );

  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      messages: [],
      isLoading: false,
      error: null,
    });
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUserMessage) return;

    const cleanedMessages = state.messages.filter(
      (msg) =>
        !(msg.role === "assistant" && msg.isError) &&
        msg.id !== lastUserMessage.id
    );

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: lastUserMessage.content,
      timestamp: new Date(),
    };

    void executeRequest(lastUserMessage.content, cleanedMessages, userMessage);
  }, [state.messages, executeRequest]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}
