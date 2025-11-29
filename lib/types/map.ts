import type { LatLng } from "./common";
import type { BuildingCategory } from "@/lib/constants/buildings";
import type { FacilityType } from "@/lib/constants/facilities";

export type MapItemKind = "building" | "facility";

export type MapItem = {
  readonly kind: MapItemKind;
  readonly id: string;
  readonly name: string;
  readonly code?: string;
  readonly category?: BuildingCategory;
  readonly facilityType?: FacilityType;
  readonly coordinates: LatLng;
};