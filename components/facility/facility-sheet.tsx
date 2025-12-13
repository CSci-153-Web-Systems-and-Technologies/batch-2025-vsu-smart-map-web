"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { FacilityHeader } from "./facility-header";
import { ContactInfo } from "./contact-info";
import { RoomList } from "./room-list";
import { ActionButtons } from "./action-buttons";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useApp } from "@/lib/context/app-context";
import { SuggestEditModal } from "@/components/suggestions/suggest-edit-modal";

export function FacilitySheet() {
  const pathname = usePathname();
  const { selectedFacility, selectFacility, facilitySheetOpen, setFacilitySheetOpen } = useApp();
  const isMapPage = pathname === "/";
  const open = !!selectedFacility && (!isMapPage || facilitySheetOpen);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSuggestOpen(false);
    }
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (isOpen) return;

          if (isMapPage) {
            setFacilitySheetOpen(false);
            return;
          }

          selectFacility(null);
        }}
      >
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 p-0 sm:h-[90dvh] sm:max-h-[90dvh] sm:max-w-lg sm:rounded-lg">
          <VisuallyHidden>
            <DialogTitle>{selectedFacility?.name ?? "Facility Details"}</DialogTitle>
            <DialogDescription>Details for {selectedFacility?.name ?? "selected facility"}</DialogDescription>
          </VisuallyHidden>

          {selectedFacility && (
            <>
              <div className="flex shrink-0 items-center gap-2 px-6 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setSuggestOpen(true)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Suggest Edit
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                <div className="space-y-6 pb-6 pt-4">
                  <FacilityHeader
                    facility={selectedFacility}
                    onAddPhoto={() => setSuggestOpen(true)}
                    parentOpen={open}
                  />
                  <ActionButtons facility={selectedFacility} />
                  <ContactInfo
                    address="Visayas State University, Baybay City, Leyte"
                    contact={{
                      website: selectedFacility.website,
                      facebook: selectedFacility.facebook,
                      phone: selectedFacility.phone,
                    }}
                  />

                  {selectedFacility.hasRooms && (
                    <>
                      <div className="h-px bg-border" />
                      <RoomList facilityId={selectedFacility.id} facilityName={selectedFacility.name} facilityCode={selectedFacility.code} />
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <SuggestEditModal
        facility={selectedFacility ?? null}
        open={suggestOpen}
        onOpenChange={(isOpen) => setSuggestOpen(isOpen)}
      />
    </>
  );
}
