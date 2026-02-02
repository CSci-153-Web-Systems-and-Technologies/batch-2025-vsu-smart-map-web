"use client";

import { Crosshair, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MyLocationButtonProps {
  isTracking: boolean;
  hasHeading: boolean;
  onLocate: () => void;
  className?: string;
}

export function MyLocationButton({
  isTracking,
  hasHeading,
  onLocate,
  className,
}: MyLocationButtonProps) {
  const handleClick = () => {
    onLocate();
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      className={cn(
        "absolute z-[1000] bg-background/95 backdrop-blur-sm shadow-md",
        "hover:bg-accent hover:text-accent-foreground",
        "transition-colors duration-200",
        "h-[30px] w-[30px] min-w-[30px] rounded-sm",
        isTracking && "ring-2 ring-blue-500 ring-offset-2 ring-offset-background",
        className
      )}
      aria-label={isTracking ? "Tracking your location" : "Show my location"}
    >
      {hasHeading ? (
        <Navigation className="h-4 w-4 text-blue-500 fill-blue-500" />
      ) : isTracking ? (
        <Crosshair className="h-4 w-4 text-blue-500" />
      ) : (
        <Crosshair className="h-4 w-4" />
      )}
    </Button>
  );
}
