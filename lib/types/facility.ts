import type { AuditFields, LatLng } from "./common";
import type { FacilityType } from "@/lib/constants/facilities";

export interface Facility extends AuditFields {
  readonly id: string;
  readonly name: string;
  readonly type: FacilityType;
  readonly description?: string;
  readonly buildingId?: string | null;
  readonly coordinates: LatLng;
  readonly isActive: boolean;
}

export interface FacilityInput {
  readonly name: string;
  readonly type: FacilityType;
  readonly description?: string;
  readonly buildingId?: string | null;
  readonly coordinates: LatLng;
  readonly isActive?: boolean;
}

export type FacilityUpdateInput = Partial<FacilityInput>;