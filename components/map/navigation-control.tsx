"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Navigation, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMap } from "react-leaflet";
import type { LatLng } from "leaflet";
import { toast } from "sonner";

interface NavigationControlProps {
  onNavigate: (start: LatLng | null, end: LatLng | null) => void;
  userLocation: LatLng | null;
}

export function NavigationControl({ onNavigate, userLocation }: NavigationControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'idle' | 'picking_start' | 'picking_end'>('idle');
  
  const map = useMap();

  const handleStartNav = () => {
    if (!userLocation) {
      toast.error("Please enable location services or wait for location.");
      return;
    }
    setIsOpen(true);
    toast.info("Tap anywhere on the map to navigate there");
    
    const onMapClick = (e: any) => {
        onNavigate(userLocation, e.latlng);
        setIsOpen(false);
        map.off('click', onMapClick);
    };
    
    map.on('click', onMapClick);
  };

  if (isOpen) {
      return (
          <div className="absolute top-20 right-4 z-[1000]">
             <Card className="p-3">
                 <div className="text-sm font-medium mb-2">Tap map to set destination</div>
                 <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                     Cancel
                 </Button>
             </Card>
          </div>
      )
  }

  return (
    <div className="leaflet-bottom leaflet-left" style={{ bottom: '80px', left: '10px', pointerEvents: 'auto' }}>
      <div className="leaflet-control">
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
    </div>
  );
}
