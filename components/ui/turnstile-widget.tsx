"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useTheme } from "next-themes";
import { memo } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export const TurnstileWidget = memo(function TurnstileWidget({ onVerify, onError, onExpire }: TurnstileWidgetProps) {
  const { resolvedTheme } = useTheme();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.warn("TurnstileWidget: NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured");
    return null;
  }

  return (
    <div className="min-h-[65px] flex items-center justify-center w-full">
      <Turnstile
        siteKey={siteKey}
        onSuccess={(token) => {
          console.log("Turnstile: verified successfully");
          onVerify(token);
        }}
        onError={(errorCode) => {
          console.error("Turnstile: verification error, code:", errorCode);
          onError?.();
        }}
        onExpire={() => {
          console.warn("Turnstile: token expired");
          onExpire?.();
        }}
        options={{
          theme: resolvedTheme === "dark" ? "dark" : "light",
          size: "normal",
          retry: "auto",
          refreshExpired: "auto",
        }}
      />
    </div>
  );
});
