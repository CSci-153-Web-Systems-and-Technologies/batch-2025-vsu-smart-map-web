"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navigation, X, Footprints, Bike, Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMap } from "react-leaflet";
import type { LatLng } from "leaflet";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TransportMode } from "@/lib/types/graph";

interface NavigationControlProps {
  onNavigate: (start: LatLng | null, end: LatLng | null, mode: TransportMode) => void;
  userLocation: LatLng | null;
}

export function NavigationControl({ onNavigate, userLocation }: NavigationControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TransportMode>('walking');
  
  useEffect(() => {
      // Load default on mount/open
      const saved = localStorage.getItem("default-transport-mode");
      if (saved) {
          setMode(saved as TransportMode);
      }
  }, [isOpen]); // Reload when opened to catch changes from settings

  const map = useMap();

  const handleStartNav = () => {
    if (!userLocation) {
      toast.error("Please enable location services or wait for location.");
      return;
    }
    
    // Safety check: Don't start nav mode if we don't have enough data?
    // Actually better to let them try, and the Layer will warn if no nodes found.
    
    setIsOpen(true);
    toast.info("Tap anywhere on the map to navigate there");
    
    const onMapClick = (e: any) => {
        onNavigate(userLocation, e.latlng, mode);
        setIsOpen(false);
        map.off('click', onMapClick);
    };
    
    map.on('click', onMapClick);
  };

  const updateMode = (newMode: TransportMode) => {
      setMode(newMode);
      // If we already have a path, we might want to re-calculate, but user needs to click again for now
      // Or we lift the mode state up.
  };

  if (isOpen) {
      return (
          <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
             <Card className="p-3">
                 <div className="text-sm font-medium mb-2">Travel Mode</div>
                 <ToggleGroup type="single" value={mode} onValueChange={(v) => v && updateMode(v as TransportMode)} className="mb-3">
                    <ToggleGroupItem value="walking" aria-label="Walking"><Footprints className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="cycling" aria-label="Cycling"><Bike className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="driving" aria-label="Driving"><Car className="h-4 w-4" /></ToggleGroupItem>
                 </ToggleGroup>
                 <div className="text-xs text-muted-foreground mb-2">Tap map to set destination</div>
                 <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="w-full">
                     Cancel
                 </Button>
             </Card>
          </div>
      )
  }

  return (
    <div className="absolute left-[12px] bottom-[13.5rem] md:bottom-[130px] z-[400]">
      <Button 
          variant="secondary" 
          size="icon" 
          className="h-10 w-10 rounded-full shadow-md bg-background border"
          onClick={handleStartNav}
          title="Navigate"
      >
        <Navigation className="h-5 w-5" />
      </Button>
    </div>
  );
}
