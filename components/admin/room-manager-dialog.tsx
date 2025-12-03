'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { Facility } from '@/lib/types/facility';
import { getRoomsByFacility } from '@/lib/supabase/queries/rooms';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RoomForm } from './room-form';
import { RoomList, type RoomRecord } from './room-list';
import {
  createRoomAction,
  deleteRoomAction,
  updateRoomAction,
} from '@/app/admin/facilities/actions';
import { useRouter } from 'next/navigation';
import type { RoomFormValues } from '@/lib/validation/room';

interface RoomManagerDialogProps {
  open: boolean;
  facility?: Facility;
  onOpenChange: (open: boolean) => void;
}

type RoomRowLike = {
  id: string;
  room_code: string;
  name?: string | null;
  description?: string | null;
  floor?: number | null;
  updated_at?: string | null;
};

const toRoomRecord = (row: RoomRowLike): RoomRecord => ({
  id: row.id,
  roomCode: row.room_code,
  name: row.name ?? undefined,
  description: row.description ?? undefined,
  floor: row.floor ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

export function RoomManagerDialog({ open, facility, onOpenChange }: RoomManagerDialogProps) {
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const title = useMemo(() => facility?.name ?? 'Rooms', [facility]);

  useEffect(() => {
    if (!open || !facility) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: roomsError } = await getRoomsByFacility({
        facilityId: facility.id,
      });

      if (roomsError) {
        setError(roomsError.message);
      } else if (data) {
        setRooms(data.map(toRoomRecord));
      } else {
        setRooms([]);
      }
      setLoading(false);
    };

    load();
  }, [facility, open]);

  const handleCreate = () => {
    setMode('create');
    setSelectedRoom(null);
    setFormOpen(true);
  };

  const handleEdit = (room: RoomRecord) => {
    setMode('edit');
    setSelectedRoom(room);
    setFormOpen(true);
  };

  const handleRoomSubmit = async (values: RoomFormValues) => {
    if (!facility) return;
    setError(null);

    if (mode === 'create') {
      const result = await createRoomAction({ ...values, facilityId: facility.id });
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.data) {
        setRooms((prev) => [...prev, toRoomRecord(result.data as RoomRowLike)]);
      }
    } else if (selectedRoom) {
      const result = await updateRoomAction(selectedRoom.id, { ...values, facilityId: facility.id });
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.data) {
        const updated = toRoomRecord(result.data);
        setRooms((prev) => prev.map((room) => (room.id === updated.id ? updated : room)));
      }
    }

    setFormOpen(false);
    startTransition(() => router.refresh());
  };

  const handleDelete = (room: RoomRecord) => {
    if (!confirm(`Delete room ${room.roomCode}?`)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteRoomAction(room.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRooms((prev) => prev.filter((item) => item.id !== room.id));
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage rooms</DialogTitle>
          <DialogDescription>
            {title}
          </DialogDescription>
        </DialogHeader>

        {!facility && (
          <p className="text-sm text-muted-foreground">Select a facility to manage rooms.</p>
        )}

        {facility && (
          <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Rooms linked to {facility.name}
              </div>
              <Button size="sm" onClick={handleCreate} disabled={isPending}>
                Add room
              </Button>
            </div>

            {formOpen && (
              <RoomForm
                facilityId={facility.id}
                initialValues={selectedRoom ?? undefined}
                submitting={isPending}
                onSubmit={handleRoomSubmit}
                onCancel={() => setFormOpen(false)}
              />
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading rooms...</p>
            ) : (
              <RoomList rooms={rooms} onEdit={handleEdit} onDelete={handleDelete} disabled={isPending} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
