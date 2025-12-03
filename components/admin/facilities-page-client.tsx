'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Facility } from '@/lib/types/facility';
import { FacilitiesTable } from './facilities-table';
import { FacilityDialog } from './facility-dialog';
import { RoomManagerDialog } from './room-manager-dialog';
import type { UnifiedFacilityFormValues } from '@/lib/validation/facility';
import {
  createFacilityAction,
  deleteFacilityAction,
  updateFacilityAction,
} from '@/app/admin/facilities/actions';
import { uploadFacilityHeroClient } from '@/lib/supabase/storage-client';

interface FacilitiesPageClientProps {
  facilities: Facility[];
}

export function FacilitiesPageClient({ facilities }: FacilitiesPageClientProps) {
  const [items, setItems] = useState<Facility[]>(facilities);
  const [message, setMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Facility | undefined>();
  const [isPending, startTransition] = useTransition();
  const [roomsOpen, setRoomsOpen] = useState(false);
  const router = useRouter();

  const handleAdd = () => {
    setSelected(undefined);
    setMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (facility: Facility) => {
    setSelected(facility);
    setMode('edit');
    setDialogOpen(true);
  };

  const handleManageRooms = (facility: Facility) => {
    setSelected(facility);
    setRoomsOpen(true);
  };

  const handleSubmit = async (
    values: UnifiedFacilityFormValues,
    options?: { file?: File | null; clearImage?: boolean },
  ) => {
    setMessage(null);
    const file = options?.file ?? null;
    const clearImage = options?.clearImage ?? false;

    if (mode === 'create') {
      const createResult = await createFacilityAction({ ...values, imageUrl: undefined });
      if (createResult.error) {
        throw new Error(createResult.error);
      }

      if (createResult.data) {
        let created = createResult.data as Facility;
        if (file) {
          const upload = await uploadFacilityHeroClient(created.id, file, file.name);
          if (upload.error) {
            throw new Error(upload.error.message);
          }
          const publicUrl = upload.data?.publicUrl ?? null;
          const updateResult = await updateFacilityAction(created.id, { imageUrl: publicUrl });
          if (updateResult.error) {
            throw new Error(updateResult.error);
          }
          if (updateResult.data) {
            created = updateResult.data as Facility;
          } else if (publicUrl) {
            created = { ...created, imageUrl: publicUrl };
          }
        }
        setItems((prev) => [...prev, created]);
      }
    } else if (selected) {
      if (clearImage && !file) {
        const result = await updateFacilityAction(selected.id, { ...values, imageUrl: null });
        if (result.error) {
          throw new Error(result.error);
        }
        if (result.data) {
          const updated = result.data as Facility;
          setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        }
      } else if (file) {
        const upload = await uploadFacilityHeroClient(selected.id, file, file.name);
        if (upload.error) {
          throw new Error(upload.error.message);
        }
        const publicUrl = upload.data?.publicUrl ?? null;
        const result = await updateFacilityAction(selected.id, {
          ...values,
          imageUrl: publicUrl,
        });
        if (result.error) {
          throw new Error(result.error);
        }
        if (result.data) {
          const updated = result.data as Facility;
          setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        }
      } else {
        const result = await updateFacilityAction(selected.id, values);
        if (result.error) {
          throw new Error(result.error);
        }
        if (result.data) {
          const updated = result.data as Facility;
          setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        }
      }
    }

    startTransition(() => router.refresh());
  };

  const handleDelete = (facility: Facility) => {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteFacilityAction(facility.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== facility.id));
      router.refresh();
    });
  };

  const dialogFacility = useMemo(
    () => items.find((item) => item.id === selected?.id),
    [items, selected]
  );

  return (
    <>
      <FacilitiesTable
        facilities={items}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onManageRooms={handleManageRooms}
        onDelete={handleDelete}
        disabled={isPending}
      />
      {message && (
        <p className="mt-3 text-sm text-destructive">
          {message}
        </p>
      )}
      <FacilityDialog
        open={dialogOpen}
        mode={mode}
        facility={dialogFacility}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onManageRooms={dialogFacility ? () => handleManageRooms(dialogFacility) : undefined}
      />
      <RoomManagerDialog
        open={roomsOpen}
        facility={dialogFacility}
        onOpenChange={setRoomsOpen}
      />
    </>
  );
}
