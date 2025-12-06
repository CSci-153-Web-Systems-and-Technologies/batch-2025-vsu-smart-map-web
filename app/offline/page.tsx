import { WifiOff } from "lucide-react";
import { RetryButton } from "@/components/retry-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description: "You are currently offline. Some features may be unavailable.",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-12 w-12 text-muted-foreground" aria-hidden />
      </div>

      <h1 className="mt-8 text-2xl font-bold text-foreground">
        You&apos;re Offline
      </h1>

      <p className="mt-4 max-w-md text-muted-foreground">
        It looks like you&apos;ve lost your internet connection.
        Some features may be unavailable, but you can still view
        previously cached map areas.
      </p>

      <RetryButton />

      <p className="mt-8 text-sm text-muted-foreground">
        Tip: Map tiles you&apos;ve viewed before are saved for offline use.
      </p>
    </div>
  );
}
