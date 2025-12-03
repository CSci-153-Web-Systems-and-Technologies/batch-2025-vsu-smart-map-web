'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { Facility } from '@/lib/types/facility';
import { FACILITY_CATEGORIES } from '@/lib/types/facility';
import { STORAGE_LIMITS } from '@/lib/constants/storage';
import { unifiedFacilitySchema, type UnifiedFacilityFormValues } from '@/lib/validation/facility';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CoordinatePicker } from './coordinate-picker';
import { MAP_DEFAULT_CENTER } from '@/lib/constants/map';

type Mode = 'create' | 'edit';

interface FacilityDialogProps {
  open: boolean;
  mode: Mode;
  facility?: Facility;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    values: UnifiedFacilityFormValues,
    options?: { file?: File | null; clearImage?: boolean },
  ) => Promise<void> | void;
  onManageRooms?: () => void;
}

const defaultCoordinates = MAP_DEFAULT_CENTER;

export function FacilityDialog({
  open,
  mode,
  facility,
  onOpenChange,
  onSubmit,
  onManageRooms,
}: FacilityDialogProps) {
  const initialValues = useMemo<UnifiedFacilityFormValues>(() => {
    if (facility) {
      return {
        code: facility.code ?? '',
        name: facility.name,
        description: facility.description ?? '',
        category: facility.category,
        hasRooms: facility.hasRooms,
        coordinates: facility.coordinates,
        imageUrl: facility.imageUrl ?? '',
        slug: facility.slug,
      };
    }
    return {
      code: '',
      name: '',
      description: '',
      category: FACILITY_CATEGORIES[0],
      hasRooms: true,
      coordinates: defaultCoordinates,
      imageUrl: '',
      slug: undefined,
    };
  }, [facility]);

  const [values, setValues] = useState<UnifiedFacilityFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(facility?.imageUrl ?? null);
  const [clearImage, setClearImage] = useState(false);

  useEffect(() => {
    if (preview && preview.startsWith('blob:')) {
      return () => URL.revokeObjectURL(preview);
    }
  }, [preview]);

  useEffect(() => {
    setValues(initialValues);
    setError(null);
    setFile(null);
    setPreview((previous) => {
      if (previous && previous.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }
      return facility?.imageUrl ?? null;
    });
    setClearImage(false);
  }, [initialValues, open, facility]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = unifiedFacilitySchema.safeParse(values);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Validation failed';
      setError(message);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data, { file, clearImage });
      onOpenChange(false);
    } catch (submitError) {
      console.error('Failed to save facility:', submitError);
      setError('Failed to save facility');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85dvh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle>{mode === 'create' ? 'Add facility' : 'Edit facility'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a building or point of interest.'
              : 'Update facility details.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Code (optional)</Label>
                  <Input
                    id="code"
                    value={values.code ?? ''}
                    onChange={(event) => setValues({ ...values, code: event.target.value })}
                    placeholder="e.g., ICT, CAS, DALL"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={values.name}
                    onChange={(event) => setValues({ ...values, name: event.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    id="category"
                    value={values.category}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        category: event.target.value as typeof values.category,
                      })
                    }
                  >
                    {FACILITY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label id="facility-type-label">Type</Label>
                  <div
                    className="flex rounded-lg border bg-muted/40 p-1"
                    role="radiogroup"
                    aria-labelledby="facility-type-label"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={values.hasRooms}
                      className={cn(
                        'flex-1 px-3 py-1 text-sm rounded-md transition',
                        values.hasRooms ? 'bg-background shadow-sm' : 'text-muted-foreground'
                      )}
                      onClick={() => setValues({ ...values, hasRooms: true })}
                    >
                      Building
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!values.hasRooms}
                      className={cn(
                        'flex-1 px-3 py-1 text-sm rounded-md transition',
                        !values.hasRooms ? 'bg-background shadow-sm' : 'text-muted-foreground'
                      )}
                      onClick={() => setValues({ ...values, hasRooms: false })}
                    >
                      POI
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={values.description ?? ''}
                  onChange={(event) => setValues({ ...values, description: event.target.value })}
                  placeholder="Add context or directions for this facility"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <CoordinatePicker
                  value={values.coordinates}
                  onChange={(coords) => setValues({ ...values, coordinates: coords })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Hero image</Label>
                {preview && (
                  <div className="rounded-lg border p-3 flex items-center gap-3">
                    <Image
                      src={preview}
                      alt="Facility hero"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-md object-cover border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (preview && preview.startsWith('blob:')) {
                          URL.revokeObjectURL(preview);
                        }
                        setPreview(null);
                        setFile(null);
                        setClearImage(true);
                        setValues({ ...values, imageUrl: '' });
                      }}
                    >
                      Remove image
                    </Button>
                  </div>
                )}
                <Input
                  id="image"
                  type="file"
                  accept={STORAGE_LIMITS.acceptedTypes.join(',')}
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0];
                    if (nextFile) {
                      if (preview && preview.startsWith('blob:')) {
                        URL.revokeObjectURL(preview);
                      }
                      setFile(nextFile);
                      setPreview(URL.createObjectURL(nextFile));
                      setClearImage(false);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Max {STORAGE_LIMITS.imageMaxMB}MB. Types: {STORAGE_LIMITS.acceptedTypes.join(', ')}.
                </p>
              </div>

              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 shrink-0 gap-2 sm:gap-0">
            {mode === 'edit' && values.hasRooms && onManageRooms && (
              <div className="flex-1 flex justify-start">
                <Button type="button" variant="outline" onClick={onManageRooms}>
                  Manage Rooms
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
