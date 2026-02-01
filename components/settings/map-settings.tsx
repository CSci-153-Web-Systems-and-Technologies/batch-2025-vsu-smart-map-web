"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Footprints, Bike, Car } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TransportMode } from "@/lib/types/graph";

export function MapSettings() {
  const [defaultMode, setDefaultMode] = useState<TransportMode>("walking");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("default-transport-mode");
    if (saved) {
        setDefaultMode(saved as TransportMode);
    }
  }, []);

  const handleModeChange = (val: string) => {
      if (!val) return;
      const mode = val as TransportMode;
      setDefaultMode(mode);
      localStorage.setItem("default-transport-mode", mode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <SettingsIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Map Settings</DialogTitle>
          <DialogDescription>
            Customize your navigation preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-3">
            <Label>Default Travel Mode</Label>
            <ToggleGroup type="single" value={defaultMode} onValueChange={handleModeChange} className="justify-start">
                <ToggleGroupItem value="walking" aria-label="Walking">
                    <Footprints className="h-4 w-4 mr-2" /> Walking
                </ToggleGroupItem>
                <ToggleGroupItem value="cycling" aria-label="Cycling">
                    <Bike className="h-4 w-4 mr-2" /> Cycling
                </ToggleGroupItem>
                <ToggleGroupItem value="driving" aria-label="Driving">
                    <Car className="h-4 w-4 mr-2" /> Driving
                </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
                This mode will be selected automatically when you start navigation.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
