'use client';

import { MoreHorizontal, Pencil, Trash2, Home, History } from 'lucide-react';
import type { Facility } from '@/lib/types/facility';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface FacilityRowActionsProps {
  facility: Facility;
  onEdit?: (facility: Facility) => void;
  onManageRooms?: (facility: Facility) => void;
  onDelete?: (facility: Facility) => void;
  onViewHistory?: (facility: Facility) => void;
  disabled?: boolean;
}

export function FacilityRowActions({
  facility,
  onEdit,
  onManageRooms,
  onDelete,
  onViewHistory,
  disabled,
}: FacilityRowActionsProps) {
  const handleEdit = () => onEdit?.(facility);
  const handleRooms = () => onManageRooms?.(facility);
  const handleDelete = () => onDelete?.(facility);
  const handleHistory = () => onViewHistory?.(facility);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open row actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={handleEdit} disabled={disabled || !onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {facility.hasRooms && (
          <DropdownMenuItem onSelect={handleRooms} disabled={disabled || !onManageRooms}>
            <Home className="h-4 w-4" />
            Manage Rooms
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={handleHistory} disabled={disabled || !onViewHistory}>
          <History className="h-4 w-4" />
          View History
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={handleDelete}
          disabled={disabled || !onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
