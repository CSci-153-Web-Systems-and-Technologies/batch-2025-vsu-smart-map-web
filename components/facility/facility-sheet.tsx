"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Pencil, ImagePlus } from "lucide-react";
import { FacilityHeader } from "./facility-header";
import { ContactInfo } from "./contact-info";
import { RoomList } from "./room-list";
import { ActionButtons } from "./action-buttons";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useApp } from "@/lib/context/app-context";
import { SuggestEditModal } from "@/components/suggestions/suggest-edit-modal";

export function FacilitySheet() {
  const pathname = usePathname();
  const { selectedFacility, selectFacility } = useApp();
  const open = !!selectedFacility;
  const onClose = () => selectFacility(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSuggestOpen(false);
    }
  }, [open]);

  const isMapPage = pathname === "/";
  if (isMapPage) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto h-[85vh] rounded-t-[20px] p-0 sm:max-w-md sm:rounded-none sm:border-l"
      >
        <SheetHeader className="px-6 pt-6">
          <VisuallyHidden>
            <SheetTitle>{selectedFacility?.name ?? "Facility Details"}</SheetTitle>
            <SheetDescription>Details for {selectedFacility?.name ?? "selected facility"}</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>

        {selectedFacility && (
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-8 pb-8">
              <FacilityHeader facility={selectedFacility} />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setSuggestOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Suggest Edit
                </Button>
                {!selectedFacility.imageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setSuggestOpen(true)}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Add Photo
                  </Button>
                )}
              </div>
              <ActionButtons facility={selectedFacility} />
              <ContactInfo address="Visayas State University, Baybay City, Leyte" />

              {selectedFacility.hasRooms && (
                <>
                  <div className="h-px bg-border" />
                  <RoomList facilityId={selectedFacility.id} />
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
      <SuggestEditModal
        facility={selectedFacility ?? null}
        open={suggestOpen}
        onOpenChange={(isOpen) => setSuggestOpen(isOpen)}
      />
    </Sheet>
  );
}
