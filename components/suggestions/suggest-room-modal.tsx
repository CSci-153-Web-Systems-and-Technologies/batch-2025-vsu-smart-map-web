"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { roomSchema, type RoomFormValues } from "@/lib/validation/room";
import { createSuggestionAction } from "@/app/actions/suggestions";

interface SuggestRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  facilityName: string;
}

export function SuggestRoomModal({
  open,
  onOpenChange,
  facilityId,
  facilityName,
}: SuggestRoomModalProps) {
  const [values, setValues] = useState<RoomFormValues>({
    facilityId,
    roomCode: "",
    name: "",
    description: "",
    floor: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues({
        facilityId,
        roomCode: "",
        name: "",
        description: "",
        floor: undefined,
      });
      setError(null);
    }
  }, [open, facilityId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = roomSchema.safeParse(values);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid room data";
      setError(message);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createSuggestionAction({
        type: "ADD_ROOM",
        targetId: facilityId,
        payload: parsed.data,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest a room</DialogTitle>
          <DialogDescription>
            Suggest a new room for <span className="font-medium">{facilityName}</span>.
            An admin will review your suggestion before it is added.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="roomCode">Room code *</Label>
              <Input
                id="roomCode"
                value={values.roomCode}
                onChange={(event) =>
                  setValues({ ...values, roomCode: event.target.value })
                }
                placeholder="e.g., 101, Lab-A"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="floor">Floor (optional)</Label>
              <Input
                id="floor"
                type="number"
                inputMode="numeric"
                min={-10}
                max={100}
                value={values.floor ?? ""}
                onChange={(event) =>
                  setValues({
                    ...values,
                    floor:
                      event.target.value === ""
                        ? undefined
                        : Math.min(100, Math.max(-10, Number(event.target.value))),
                  })
                }
                placeholder="e.g., 1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={values.name ?? ""}
              onChange={(event) =>
                setValues({ ...values, name: event.target.value })
              }
              placeholder="e.g., Computer Lab, Conference Room"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={values.description ?? ""}
              onChange={(event) =>
                setValues({ ...values, description: event.target.value })
              }
              placeholder="What is this room used for?"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="status">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit suggestion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
