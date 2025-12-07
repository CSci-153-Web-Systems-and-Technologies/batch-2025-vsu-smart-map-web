"use client";

import { useEffect, useState } from "react";
import { getRoomsByFacility } from "@/lib/supabase/queries/rooms";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus } from "lucide-react";
import { SuggestRoomModal } from "@/components/suggestions/suggest-room-modal";

interface RoomRow {
    id: string;
    facility_id: string;
    room_code: string;
    name: string | null;
    description: string | null;
    floor: number | null;
}

interface RoomListProps {
    facilityId: string;
    facilityName: string;
}

export function RoomList({ facilityId, facilityName }: RoomListProps) {
    const [rooms, setRooms] = useState<RoomRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [suggestOpen, setSuggestOpen] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function fetchRooms() {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await getRoomsByFacility({ facilityId });
                if (error) {
                    throw new Error(error.message);
                }
                if (mounted) {
                    setRooms((data as RoomRow[]) || []);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Failed to load rooms");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchRooms();

        return () => {
            mounted = false;
        };
    }, [facilityId]);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Rooms</h3>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
            </div>
        );
    }

    const renderHeader = () => (
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Rooms</h3>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setSuggestOpen(true)}
            >
                <Plus className="h-3.5 w-3.5" />
                Suggest room
            </Button>
        </div>
    );

    if (rooms.length === 0) {
        return (
            <>
                <div className="space-y-3">
                    {renderHeader()}
                    <p className="text-sm text-muted-foreground">
                        No rooms listed yet. Know a room in this building?
                    </p>
                </div>
                <SuggestRoomModal
                    open={suggestOpen}
                    onOpenChange={setSuggestOpen}
                    facilityId={facilityId}
                    facilityName={facilityName}
                />
            </>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {renderHeader()}
                <div className="grid gap-2">
                    {rooms.map((room) => (
                        <Card key={room.id} className="overflow-hidden">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{room.room_code}</span>
                                            {room.floor !== null && (
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                                    Floor {room.floor}
                                                </span>
                                            )}
                                        </div>
                                        {room.name && (
                                            <p className="text-sm text-muted-foreground">{room.name}</p>
                                        )}
                                    </div>
                                </div>
                                {room.description && (
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                        {room.description}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            <SuggestRoomModal
                open={suggestOpen}
                onOpenChange={setSuggestOpen}
                facilityId={facilityId}
                facilityName={facilityName}
            />
        </>
    );
}
