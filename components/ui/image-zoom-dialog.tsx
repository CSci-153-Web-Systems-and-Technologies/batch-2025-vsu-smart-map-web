"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageZoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}

export function ImageZoomDialog({
  open,
  onOpenChange,
  src,
  alt,
}: ImageZoomDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden"
        aria-describedby="image-zoom-description"
      >
        <div id="image-zoom-description" className="sr-only">
          Zoomed view of {alt}. Use controls to zoom in, zoom out, or rotate the image.
        </div>

        <div className="absolute top-2 right-2 z-50 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleRotate}
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative flex items-center justify-center w-full h-[95vh] overflow-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div
            className={cn(
              "relative transition-transform duration-200 ease-out",
              "min-w-[200px] min-h-[200px]"
            )}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="object-contain max-w-full max-h-full"
              quality={100}
              priority
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
