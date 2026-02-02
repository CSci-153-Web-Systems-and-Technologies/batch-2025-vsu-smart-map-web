"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const MapWrapper = dynamic(() => import("./map-wrapper").then((m) => m.MapWrapper), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-muted animate-pulse rounded-lg" aria-label="Loading map" />
  ),
}) as ComponentType<React.ComponentProps<"div">>;

type MapContainerProps = {
  children?: React.ReactNode;
  className?: string;
};

export function MapContainerClient({ children, className }: MapContainerProps) {
  return <MapWrapper className={className}>{children}</MapWrapper>;
}
