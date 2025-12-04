"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHeader } from "./chat-header";
import { ChatWelcome } from "./chat-welcome";
import { ChatMessage } from "./chat-message";
import { ChatFacilityCards } from "./chat-facility-cards";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";

export function ChatView() {
  const { messages, isLoading, sendMessage, clearMessages, retryLastMessage } =
    useChat({ streaming: true });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <ChatHeader onClear={clearMessages} hasMessages={hasMessages} />

      <ScrollArea className="flex-1">
        {!hasMessages ? (
          <ChatWelcome onSuggestionSelect={sendMessage} disabled={isLoading} />
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((message, index) => {
              const isLastAssistant =
                message.role === "assistant" && index === messages.length - 1;

              return (
                <div key={`${message.id}-${index}`} className="space-y-2">
                  <ChatMessage
                    message={message}
                    onRetry={
                      message.isError && isLastAssistant
                        ? retryLastMessage
                        : undefined
                    }
                    onFollowUp={
                      message.followUp ? () => sendMessage(message.followUp!) : undefined
                    }
                  />
                  {message.facilities && (
                    <div className="ml-11">
                      <ChatFacilityCards matches={message.facilities} />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && <TypingIndicator />}
            <div ref={endRef} />
          </div>
        )}
      </ScrollArea>

      <ChatInput onSubmit={sendMessage} disabled={isLoading} />
    </div>
  );
}
