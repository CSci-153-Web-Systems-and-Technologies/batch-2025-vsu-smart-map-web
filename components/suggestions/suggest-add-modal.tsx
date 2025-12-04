"use client";

import { useEffect, useState } from "react";
import { FacilityDialog } from "@/components/admin/facility-dialog";
import type { UnifiedFacilityFormValues } from "@/lib/validation/facility";
import { createSuggestionAction } from "@/app/actions/suggestions";
import { uploadFacilityHeroClient } from "@/lib/supabase/storage-client";

interface SuggestAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SuggestAddModal({ open, onOpenChange, onSuccess }: SuggestAddModalProps) {
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
    setMessage(null);

    const file = options?.file ?? null;
    const clearImage = options?.clearImage ?? false;
    let imageUrl = values.imageUrl ?? null;

    if (file) {
      const tempId = crypto.randomUUID();
      const upload = await uploadFacilityHeroClient(tempId, file, file.name);
      if (upload.error) {
        setMessage(upload.error.message);
        return;
      }
      imageUrl = upload.data?.publicUrl ?? imageUrl;
    } else if (clearImage) {
      imageUrl = null;
    }

    const payload: UnifiedFacilityFormValues = {
      ...values,
      imageUrl: imageUrl ?? undefined,
    };

    const result = await createSuggestionAction({
      type: "ADD_FACILITY",
      targetId: null,
      payload,
    });

    if (result.error) {
      setMessage(result.error);
      return;
    }

    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <FacilityDialog
      open={open}
      mode="create"
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title="Suggest a place"
      description="Share details for a new building or point of interest so we can add it to the map."
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
