"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface DeviceOrientationEventWithCompass extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export interface GeolocationState {
  position: GeolocationPosition | null;
  heading: number | null;
  error: GeolocationPositionError | null;
  isTracking: boolean;
  isSupported: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 60000,
};

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    heading: null,
    error: null,
    isTracking: false,
    isSupported: typeof navigator !== "undefined" && "geolocation" in navigator,
  });

  const watchIdRef = useRef<number | null>(null);
  const mergedOptions = useMemo((): PositionOptions => ({
    enableHighAccuracy: options.enableHighAccuracy ?? defaultOptions.enableHighAccuracy,
    timeout: options.timeout ?? defaultOptions.timeout,
    maximumAge: options.maximumAge ?? defaultOptions.maximumAge,
  }), [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState((prev) => ({
      ...prev,
      position,
      error: null,
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      error,
      isTracking: false,
    }));
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEventWithCompass) => {
    if (event.alpha !== null) {
      const heading = event.webkitCompassHeading ?? (360 - event.alpha);
      setState((prev) => ({
        ...prev,
        heading,
      }));
    }
  }, []);

  const startTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      return;
    }

    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: {
          code: 2,
          message: "Geolocation is not supported",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }));

    const fastOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 300000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleSuccess(position);
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          mergedOptions
        );
      },
      () => {
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          mergedOptions
        );
      },
      fastOptions
    );

    if (typeof DeviceOrientationEvent !== "undefined") {
      const requestPermission = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
      if (typeof requestPermission === "function") {
        requestPermission()
          .then((response: string) => {
            if (response === "granted") {
              window.addEventListener("deviceorientation", handleOrientation, true);
            }
          })
          .catch((err) => {
            console.warn("DeviceOrientationEvent permission denied:", err);
          });
      } else {
        window.addEventListener("deviceorientation", handleOrientation, true);
      }
    }
  }, [state.isSupported, handleSuccess, handleError, handleOrientation, mergedOptions]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    window.removeEventListener("deviceorientation", handleOrientation, true);

    setState((prev) => ({
      ...prev,
      isTracking: false,
    }));
  }, [handleOrientation]);

  const flyToUser = useCallback(() => {
    if (!state.isTracking) {
      startTracking();
    }
    return state.position;
  }, [state.isTracking, state.position, startTracking]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation]);

  return {
    ...state,
    startTracking,
    stopTracking,
    flyToUser,
  };
}
