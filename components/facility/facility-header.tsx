import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategoryMeta } from "@/lib/constants/facilities";
import type { Facility } from "@/lib/types/facility";
import { cn } from "@/lib/utils";

interface FacilityHeaderProps {
    facility: Facility;
    className?: string;
    onAddPhoto?: () => void;
}

export function FacilityHeader({ facility, className, onAddPhoto }: FacilityHeaderProps) {
    const meta = getCategoryMeta(facility.category);
    const hasImage = !!facility.imageUrl;

    return (
        <div className={cn("space-y-4", className)}>
            <div
                className={cn(
                    "relative w-full overflow-hidden rounded-lg",
                    hasImage ? "aspect-video" : "aspect-[3/1]"
                )}
            >
                {hasImage ? (
                    <Image
                        src={facility.imageUrl!}
                        alt={facility.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={onAddPhoto}
                        className="flex h-full w-full items-center justify-center gap-2 bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                    >
                        <ImagePlus className="h-5 w-5" aria-hidden />
                        <span className="text-sm font-medium">Add Photo</span>
                    </button>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h2 className="text-2xl font-bold leading-tight">{facility.name}</h2>
                    <Badge
                        variant="outline"
                        style={{
                            backgroundColor: meta.color,
                            borderColor: meta.color,
                            color: "#ffffff",
                        }}
                    >
                        {meta.label}
                    </Badge>
                </div>

                {facility.code && (
                    <p className="text-sm font-medium text-muted-foreground">
                        Code: {facility.code}
                    </p>
                )}

                {facility.description && (
                    <p className="text-sm text-muted-foreground">{facility.description}</p>
                )}
            </div>
        </div>
    );
}
