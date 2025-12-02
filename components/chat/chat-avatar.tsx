import { Bot, User } from "lucide-react";
import type { MessageRole } from "@/lib/types";

interface ChatAvatarProps {
  role: MessageRole;
}

export function ChatAvatar({ role }: ChatAvatarProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isAssistant
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
    </div>
  );
}
