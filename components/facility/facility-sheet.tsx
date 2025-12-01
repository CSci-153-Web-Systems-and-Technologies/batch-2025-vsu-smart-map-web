"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Facility } from "@/lib/types/facility";
import { FacilityHeader } from "./facility-header";
import { ContactInfo } from "./contact-info";
import { RoomList } from "./room-list";
import { ActionButtons } from "./action-buttons";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface FacilitySheetProps {
    facility: Facility | null;
    open: boolean;
    onClose: () => void;
}

export function FacilitySheet({ facility, open, onClose }: FacilitySheetProps) {
    if (!facility) return null;

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent
                side="bottom"
                className="h-[85vh] rounded-t-[20px] p-0 sm:max-w-md sm:rounded-none sm:border-l"
            >
                <SheetHeader className="px-6 pt-6">
                    <VisuallyHidden>
                        <SheetTitle>{facility.name}</SheetTitle>
                        <SheetDescription>Details for {facility.name}</SheetDescription>
                    </VisuallyHidden>
                </SheetHeader>

                <ScrollArea className="h-full px-6 pb-6">
                    <div className="space-y-8 pb-8">
                        <FacilityHeader facility={facility} />

                        <ActionButtons facility={facility} />

                        {/* Contact info placeholder - data not yet in DB */}
                        <ContactInfo address="Visayas State University, Baybay City, Leyte" />

                        {facility.hasRooms && (
                            <>
                                <div className="h-px bg-border" />
                                <RoomList facilityId={facility.id} />
                            </>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
