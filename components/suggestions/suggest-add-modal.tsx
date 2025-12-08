"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { FacilityDialog } from "@/components/admin/facility-dialog";
import type { UnifiedFacilityFormValues } from "@/lib/validation/facility";
import { createSuggestionAction } from "@/app/actions/suggestions";
import { uploadSuggestionImageClient } from "@/lib/supabase/storage-client";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

interface SuggestAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SuggestAddModal({ open, onOpenChange, onSuccess }: SuggestAddModalProps) {
  const [message, setMessage] = useState<string | null>(null);
  const turnstileTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMessage(null);
      turnstileTokenRef.current = null;
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
      const upload = await uploadSuggestionImageClient(tempId, file);
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
      turnstileToken: turnstileTokenRef.current ?? undefined,
    });

    if (result.error) {
      setMessage(result.error);
      toast.error("Failed to submit suggestion");
      return;
    }

    toast.success("Suggestion submitted! Thank you for contributing.");
    onOpenChange(false);
    onSuccess?.();
  };

  const handleTurnstileVerify = useCallback((token: string) => {
    turnstileTokenRef.current = token;
  }, []);

  const handleTurnstileError = useCallback(() => {
    turnstileTokenRef.current = null;
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    turnstileTokenRef.current = null;
  }, []);

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
      <div className="px-6 pb-4 space-y-3">
        <TurnstileWidget
          onVerify={handleTurnstileVerify}
          onError={handleTurnstileError}
          onExpire={handleTurnstileExpire}
        />
        {message && (
          <p className="text-sm text-destructive" role="status">
            {message}
          </p>
        )}
      </div>
    </FacilityDialog>
  );
}
