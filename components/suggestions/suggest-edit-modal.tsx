"use client";

import { useEffect, useState } from "react";
import { FacilityDialog } from "@/components/admin/facility-dialog";
import type { Facility } from "@/lib/types/facility";
import type { UnifiedFacilityFormValues } from "@/lib/validation/facility";
import { createSuggestionAction } from "@/app/actions/suggestions";
import { uploadFacilityHeroClient } from "@/lib/supabase/storage-client";

interface SuggestEditModalProps {
  facility: Facility | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuggestEditModal({ facility, open, onOpenChange }: SuggestEditModalProps) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMessage(null);
    }
  }, [open]);

  const handleSubmit = async (
    values: UnifiedFacilityFormValues,
    options?: { file?: File | null; clearImage?: boolean },
  ) => {
    if (!facility) return;
    setMessage(null);

    const file = options?.file ?? null;
    const clearImage = options?.clearImage ?? false;
    let imageUrl = values.imageUrl ?? null;

    if (clearImage) {
      imageUrl = null;
    }

    if (file) {
      const tempId = crypto.randomUUID();
      const upload = await uploadFacilityHeroClient(tempId, file, file.name);
      if (upload.error) {
        setMessage(upload.error.message);
        return;
      }
      imageUrl = upload.data?.publicUrl ?? imageUrl;
    }

    const payload: UnifiedFacilityFormValues = {
      ...values,
      imageUrl: imageUrl ?? undefined,
    };

    const result = await createSuggestionAction({
      type: "EDIT_FACILITY",
      targetId: facility.id,
      payload,
    });

    if (result.error) {
      setMessage(result.error);
      return;
    }

    onOpenChange(false);
  };

  return (
    <FacilityDialog
      open={open}
      mode="edit"
      facility={facility ?? undefined}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title="Suggest edits"
      description="Propose updates to this facility. An admin will review before publishing."
      submitLabel="Submit suggestion"
      submittingLabel="Submitting..."
    >
      {message && (
        <p className="px-6 pb-4 text-sm text-destructive" role="status">
          {message}
        </p>
      )}
    </FacilityDialog>
  );
}
