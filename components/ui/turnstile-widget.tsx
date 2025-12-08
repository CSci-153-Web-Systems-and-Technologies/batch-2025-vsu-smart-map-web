"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useTheme } from "next-themes";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
}

export function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const { resolvedTheme } = useTheme();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return null;
  }

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onError={onError}
      options={{
        theme: resolvedTheme === "dark" ? "dark" : "light",
        size: "flexible",
      }}
    />
  );
}
