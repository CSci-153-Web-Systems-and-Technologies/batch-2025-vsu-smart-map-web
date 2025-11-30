import type { LatLng } from "./common";
import type { FacilityCategory } from "@/lib/types/facility";

export type MapItem = {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
  readonly category?: FacilityCategory;
  readonly hasRooms?: boolean;
  readonly coordinates: LatLng;
};