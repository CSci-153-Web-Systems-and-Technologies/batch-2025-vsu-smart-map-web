"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approveSuggestion, rejectSuggestion } from "@/app/admin/suggestions/actions";
import { toast } from "sonner";

interface SuggestionActionsProps {
  suggestionId: string;
  disabled?: boolean;
}

export function SuggestionActions({ suggestionId, disabled }: SuggestionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"approve" | "reject">("approve");
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = () => {
    setDialogMode("approve");
    setConfirmDialogOpen(true);
  };

  const handleReject = () => {
    setDialogMode("reject");
    setRejectReason("");
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      if (dialogMode === "approve") {
        const result = await approveSuggestion(suggestionId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Suggestion approved and applied successfully.");
          router.push("/admin/suggestions");
        }
      } else {
        const result = await rejectSuggestion(suggestionId, rejectReason || undefined);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Suggestion rejected.");
          router.push("/admin/suggestions");
        }
      }
      setConfirmDialogOpen(false);
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleApprove}
          disabled={disabled || isPending}
          className="gap-2"
        >
          {isPending && dialogMode === "approve" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Approve
        </Button>
        <Button
          variant="destructive"
          onClick={handleReject}
          disabled={disabled || isPending}
          className="gap-2"
        >
          {isPending && dialogMode === "reject" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
          Reject
        </Button>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogMode === "approve" ? "Approve Suggestion?" : "Reject Suggestion?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMode === "approve"
                ? "This will apply the suggested changes to the database. This action cannot be undone."
                : "This will permanently reject the suggestion. Optionally provide a reason."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {dialogMode === "reject" && (
            <div className="space-y-2 py-2">
              <Label htmlFor="reject-reason">Reason (optional)</Label>
              <Textarea
                id="reject-reason"
                placeholder="Explain why this suggestion was rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className={dialogMode === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {dialogMode === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
