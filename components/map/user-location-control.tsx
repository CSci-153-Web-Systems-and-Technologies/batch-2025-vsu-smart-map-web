"use client";

import { useCallback, useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/use-geolocation";
import { UserLocationMarker } from "./user-location-marker";
import { MyLocationButton } from "./my-location-button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface UserLocationControlProps {
  className?: string;
}

const LOCATION_PERMISSION_KEY = "vsu-smartmap-location-consent";

export function UserLocationControl({ className }: UserLocationControlProps) {
  const map = useMap();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const {
    position,
    heading,
    error,
    isTracking,
    isSupported,
    startTracking,
  } = useGeolocation();

  const hasConsented = useCallback(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LOCATION_PERMISSION_KEY) === "true";
  }, []);

  const handleLocate = useCallback(() => {
    if (!isSupported) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (isTracking && position) {
      map.flyTo(
        [position.coords.latitude, position.coords.longitude],
        18,
        { duration: 0.5 }
      );
    } else if (hasConsented()) {
      startTracking();
    } else {
      setShowPermissionDialog(true);
    }
  }, [isSupported, isTracking, position, map, startTracking, hasConsented]);

  const handlePermissionConfirm = useCallback(() => {
    localStorage.setItem(LOCATION_PERMISSION_KEY, "true");
    setShowPermissionDialog(false);
    startTracking();
  }, [startTracking]);

  const handlePermissionCancel = useCallback(() => {
    setShowPermissionDialog(false);
  }, []);

  useEffect(() => {
    if (position && isTracking) {
      map.flyTo(
        [position.coords.latitude, position.coords.longitude],
        Math.max(map.getZoom(), 17),
        { duration: 0.5 }
      );
    }
  }, [position, isTracking, map]);

  useEffect(() => {
    if (error) {
      const messages: Record<number, string> = {
        1: "Location access denied. Please enable location permissions.",
        2: "Unable to determine your location.",
        3: "Location request timed out. Please try again.",
      };
      toast.error(messages[error.code] || "Location error occurred");
    }
  }, [error]);

  return (
    <>
      {position && isTracking && (
        <UserLocationMarker position={position} heading={heading} />
      )}

      <MyLocationButton
        isTracking={isTracking}
        hasHeading={heading !== null}
        onLocate={handleLocate}
        className={className || "left-3 bottom-40 md:left-4 md:bottom-24"}
      />

      <ConfirmDialog
        open={showPermissionDialog}
        title="Enable Location Access?"
        description="VSU SmartMap would like to access your location to show where you are on campus. Your location data stays on your device and is not stored or shared."
        confirmLabel="Enable Location"
        cancelLabel="Not Now"
        confirmVariant="default"
        onConfirm={handlePermissionConfirm}
        onCancel={handlePermissionCancel}
      />
    </>
  );
}
