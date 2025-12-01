"use client";

import { Button } from "@/components/ui/button";
import type { Facility } from "@/lib/types/facility";
import { Share2, Map, Check } from "lucide-react";
import { useState } from "react";

interface ActionButtonsProps {
    facility: Facility;
    className?: string;
}

export function ActionButtons({ facility, className }: ActionButtonsProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = `${window.location.origin}/?facility=${facility.id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleDirections = () => {
        const { lat, lng } = facility.coordinates;
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className={className}>
            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleShare}
                >
                    {copied ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <Share2 className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Share"}
                </Button>
                <Button className="w-full gap-2" onClick={handleDirections}>
                    <Map className="h-4 w-4" />
                    Directions
                </Button>
            </div>
        </div>
    );
}
