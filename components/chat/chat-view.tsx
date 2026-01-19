"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHeader } from "./chat-header";
import { ChatWelcome } from "./chat-welcome";
import { ChatMessage } from "./chat-message";
import { ChatFacilityCards } from "./chat-facility-cards";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { useChatLimit } from "@/hooks/use-chat-limit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export function ChatView() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages, retryLastMessage } =
    useChat({ streaming: true });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem("ai-disclaimer-seen");
    if (!hasSeenDisclaimer) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => setShowDisclaimer(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDisclaimerConfirm = () => {
    localStorage.setItem("ai-disclaimer-seen", "true");
    setShowDisclaimer(false);
  };

  const hasMessages = messages.length > 0;

  const { remaining, limit, isLimitReached, increment } = useChatLimit();

  const handleSendMessage = async (message: string) => {
    if (isLimitReached) return;

    increment();
    await sendMessage(message);
  };

  return (
    <div className="flex h-full flex-col">
      <ChatHeader onClear={clearMessages} hasMessages={hasMessages} />

      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        {!hasMessages ? (
          <ChatWelcome onSuggestionSelect={handleSendMessage} disabled={isLoading} />
        ) : (
          <div
            className="space-y-4 p-4"
            role="log"
            aria-live="polite"
            aria-busy={isLoading}
            aria-label="Chat messages"
          >
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
                      message.followUp ? () => handleSendMessage(message.followUp!) : undefined
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

      <ChatInput
        onSubmit={handleSendMessage}
        disabled={isLoading}
        remaining={remaining}
        limit={limit}
      />

      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <DialogTitle>AI Assistant Disclaimer</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              This AI assistant uses advanced language models to help you navigate VSU.
              <br /><br />
              <strong>Please note:</strong> While we strive for accuracy, the AI may occasionally produce incorrect information. Always verify critical details like building locations or office hours with official university sources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleDisclaimerConfirm} className="w-full sm:w-auto">
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
