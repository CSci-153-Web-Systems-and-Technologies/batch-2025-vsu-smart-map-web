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
  timeout: 45000,
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
  const watchModeRef = useRef<"low" | "high">("low");
  const hasUpgradedRef = useRef(false);
  const retryCountRef = useRef(0);
  const mergedOptions = useMemo((): PositionOptions => ({
    enableHighAccuracy: options.enableHighAccuracy ?? defaultOptions.enableHighAccuracy,
    timeout: options.timeout ?? defaultOptions.timeout,
    maximumAge: options.maximumAge ?? defaultOptions.maximumAge,
  }), [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  const mergedTimeout = mergedOptions.timeout ?? defaultOptions.timeout ?? 45000;
  const mergedMaximumAge = mergedOptions.maximumAge ?? defaultOptions.maximumAge ?? 60000;

  const lowAccuracyOptions = useMemo<PositionOptions>(() => ({
    enableHighAccuracy: false,
    timeout: Math.min(20000, mergedTimeout),
    maximumAge: Math.max(300000, mergedMaximumAge),
  }), [mergedTimeout, mergedMaximumAge]);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState((prev) => ({
      ...prev,
      position,
      error: null,
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    const isTimeout = error.code === error.TIMEOUT || error.code === 3;

    if (
      isTimeout &&
      state.isTracking &&
      watchModeRef.current === "high" &&
      retryCountRef.current < 1
    ) {
      retryCountRef.current += 1;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchModeRef.current = "low";
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        lowAccuracyOptions
      );

      setState((prev) => ({
        ...prev,
        error,
        isTracking: true,
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      error,
      isTracking: false,
    }));
  }, [state.isTracking, handleSuccess, lowAccuracyOptions]);

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

    hasUpgradedRef.current = false;
    retryCountRef.current = 0;
    watchModeRef.current = "low";

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
          lowAccuracyOptions
        );
      },
      () => {
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          lowAccuracyOptions
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
  }, [state.isSupported, handleSuccess, handleError, handleOrientation, lowAccuracyOptions]);

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

  useEffect(() => {
    if (
      !state.isTracking ||
      !state.position ||
      hasUpgradedRef.current ||
      watchModeRef.current !== "low" ||
      !mergedOptions.enableHighAccuracy
    ) {
      return;
    }

    hasUpgradedRef.current = true;
    retryCountRef.current = 0;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchModeRef.current = "high";
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      mergedOptions
    );
  }, [state.isTracking, state.position, mergedOptions, handleSuccess, handleError]);

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
