'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface RoomRecord {
  id: string;
  roomCode: string;
  name?: string;
  description?: string;
  floor?: number;
  updatedAt?: string;
}

interface RoomListProps {
  rooms: RoomRecord[];
  onEdit: (room: RoomRecord) => void;
  onDelete: (room: RoomRecord) => void;
  disabled?: boolean;
}

export function RoomList({ rooms, onEdit, onDelete, disabled }: RoomListProps) {
  if (!rooms.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This building has no rooms yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rooms</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2 font-semibold">Code</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Floor</th>
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 align-middle font-medium">{room.roomCode}</td>
                  <td className="px-4 py-3 align-middle text-muted-foreground">
                    {room.name || '—'}
                  </td>
                  <td className="px-4 py-3 align-middle text-muted-foreground">
                    {room.floor ?? '—'}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(room)}
                        disabled={disabled}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(room)}
                        disabled={disabled}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
