import { useState, useEffect, useCallback } from 'react';
import type { LatLng } from 'leaflet';

interface NavigationState {
  navStart: LatLng | null;
  navEnd: LatLng | null;
  routeStartTime: number | null; // Timestamp when the route was set
}

const LOCAL_STORAGE_KEY = 'vsu-smartmap-navigation';
const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export function useNavigationPersistence() {
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    if (typeof window === 'undefined') {
      return { navStart: null, navEnd: null, routeStartTime: null };
    }
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: NavigationState = JSON.parse(stored);
        // Check for 2-hour timeout
        if (parsed.routeStartTime && (Date.now() - parsed.routeStartTime) < TIMEOUT_MS) {
          return parsed;
        } else {
          // Clear expired state
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to parse navigation state from localStorage", error);
    }
    return { navStart: null, navEnd: null, routeStartTime: null };
  });

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(navigationState));
    }
  }, [navigationState]);

  // Functions to update specific parts of the navigation state
  const setNavStart = useCallback((point: LatLng | null) => {
    setNavigationState(prev => ({
      ...prev,
      navStart: point,
      routeStartTime: point || prev.navEnd ? (prev.routeStartTime || Date.now()) : null,
    }));
  }, []);

  const setNavEnd = useCallback((point: LatLng | null) => {
    setNavigationState(prev => ({
      ...prev,
      navEnd: point,
      routeStartTime: point || prev.navStart ? (prev.routeStartTime || Date.now()) : null,
    }));
  }, []);

  const clearNavigation = useCallback(() => {
    setNavigationState({ navStart: null, navEnd: null, routeStartTime: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  return {
    navStart: navigationState.navStart,
    setNavStart,
    navEnd: navigationState.navEnd,
    setNavEnd,
    routeStartTime: navigationState.routeStartTime,
    clearNavigation,
  };
}
