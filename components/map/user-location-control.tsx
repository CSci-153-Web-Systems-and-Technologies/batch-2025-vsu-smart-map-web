"use client";

import { useCallback, useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { toast } from "sonner";
import type { GeolocationState } from "@/hooks/use-geolocation";
import { UserLocationMarker } from "./user-location-marker";
import { MyLocationButton } from "./my-location-button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useApp } from "@/lib/context/app-context";

import L from "leaflet";

interface UserLocationControlProps {
  className?: string;
  destination?: { lat: number; lng: number } | null;
  selectedFacility?: { lat: number; lng: number } | null;
  geo: Pick<GeolocationState, "position" | "heading" | "error" | "isTracking" | "isSupported"> & {
    startTracking: () => void;
  };
}

const LOCATION_PERMISSION_KEY = "vsu-smartmap-location-consent";

export function UserLocationControl({ className, destination, selectedFacility, geo }: UserLocationControlProps) {
  const map = useMap();
  const { locationPromptOpen, setLocationPromptOpen } = useApp();
  const {
    position,
    heading,
    error,
    isTracking,
    isSupported,
    startTracking,
  } = geo;

  const hasConsented = useCallback(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LOCATION_PERMISSION_KEY) === "true";
  }, []);

  const [hasStartedRef] = useState({ value: false });

  useEffect(() => {
    // Only auto-start ONCE on mount if consented
    if (typeof window !== "undefined" && hasConsented() && !isTracking && !hasStartedRef.value) {
        hasStartedRef.value = true;
        startTracking();
    }
  }, [hasConsented, isTracking, startTracking, hasStartedRef]);

  const handleLocate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (e.currentTarget) {
      L.DomEvent.disableClickPropagation(e.currentTarget as unknown as HTMLElement);
    }
    
    if (!isSupported) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (position) {
      const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
      const target = destination || selectedFacility;
      
      if (target) {
          const targetLatLng = L.latLng(target.lat, target.lng);
          const distance = userLatLng.distanceTo(targetLatLng);

          if (distance < 10) {
            map.flyTo(userLatLng, 18, { duration: 0.8 });
          } else {
            const bounds = L.latLngBounds([userLatLng, targetLatLng]);
            map.fitBounds(bounds, { 
              padding: [100, 100], 
              maxZoom: 18, 
              duration: 0.8,
              animate: true 
            });
          }
      } else {
          map.flyTo(userLatLng, 18, { duration: 0.8 });
      }
    } else if (hasConsented()) {
      startTracking();
    } else {
      setLocationPromptOpen(true);
    }
  }, [isSupported, position, map, startTracking, hasConsented, destination, selectedFacility, setLocationPromptOpen]);

  const handlePermissionConfirm = useCallback(() => {
    localStorage.setItem(LOCATION_PERMISSION_KEY, "true");
    setLocationPromptOpen(false);
    startTracking();
  }, [startTracking, setLocationPromptOpen]);

  const handlePermissionCancel = useCallback(() => {
    setLocationPromptOpen(false);
  }, [setLocationPromptOpen]);

  // Remove the aggressive auto-centering effect
  // useEffect(() => {
  //   if (position && isTracking) {
  //     map.flyTo(
  //       [position.coords.latitude, position.coords.longitude],
  //       Math.max(map.getZoom(), 17),
  //       { duration: 0.5 }
  //     );
  //   }
  // }, [position, isTracking, map]);

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
      {position && (
        <UserLocationMarker position={position} heading={heading} />
      )}

      <MyLocationButton
        isTracking={isTracking}
        hasHeading={heading !== null}
        onLocate={handleLocate}
        className={className || "left-[12px] bottom-40 md:bottom-[80px]"}
      />

      <ConfirmDialog
        open={locationPromptOpen}
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
