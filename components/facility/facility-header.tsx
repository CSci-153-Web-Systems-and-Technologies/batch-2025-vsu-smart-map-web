import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { getCategoryMeta } from "@/lib/constants/facilities";
import type { Facility } from "@/lib/types/facility";
import { cn } from "@/lib/utils";

interface FacilityHeaderProps {
    facility: Facility;
    className?: string;
}

export function FacilityHeader({ facility, className }: FacilityHeaderProps) {
    const meta = getCategoryMeta(facility.category);

    return (
        <div className={cn("space-y-4", className)}>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                {facility.imageUrl ? (
                    <Image
                        src={facility.imageUrl}
                        alt={facility.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                        <span className="text-sm">No image available</span>
                    </div>
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
