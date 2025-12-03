'use client';

import { useEffect, useState } from 'react';
import { roomSchema, type RoomFormValues } from '@/lib/validation/room';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RoomFormProps {
  facilityId: string;
  initialValues?: Partial<RoomFormValues>;
  onSubmit: (values: RoomFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

export function RoomForm({
  facilityId,
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: RoomFormProps) {
  const [values, setValues] = useState<RoomFormValues>({
    facilityId,
    roomCode: initialValues?.roomCode ?? '',
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    floor: initialValues?.floor,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      facilityId,
      roomCode: initialValues?.roomCode ?? '',
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      floor: initialValues?.floor,
    });
  }, [facilityId, initialValues]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = roomSchema.safeParse(values);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid room data';
      setError(message);
      return;
    }

    await onSubmit(parsed.data);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between pb-4 border-b mb-4">
        <h3 className="text-lg font-bold text-primary">
          {initialValues?.roomCode ? 'Edit Room' : 'Add New Room'}
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="roomCode">Room code</Label>
          <Input
            id="roomCode"
            value={values.roomCode}
            onChange={(event) => setValues({ ...values, roomCode: event.target.value })}
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
            value={values.floor ?? ''}
            onChange={(event) =>
              setValues({
                ...values,
                floor:
                  event.target.value === ''
                    ? undefined
                    : Math.min(100, Math.max(-10, Number(event.target.value))),
              })
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          value={values.name ?? ''}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={values.description ?? ''}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save room'}
        </Button>
      </div>
    </form>
  );
}
