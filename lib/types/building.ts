import type { AuditFields, ContactInfo, ImageAsset, LatLng } from "./common";
import type { Room } from "./room";

export type BuildingCategory =
  | "ACADEMIC"
  | "ADMINISTRATIVE"
  | "DORMITORY"
  | "SERVICE"
  | "SPORTS"
  | "LABORATORY";

export interface Building extends AuditFields {
  readonly id: string;
  readonly code: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly category: BuildingCategory;
  readonly contacts?: ContactInfo;
  readonly heroImage?: ImageAsset;
  readonly coordinates: LatLng;
  readonly address?: string;
  readonly tags?: readonly string[];
  readonly isFeatured?: boolean;
}

export interface MapMarkerPayload {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly category: BuildingCategory;
  readonly coordinates: LatLng;
}

export type BuildingSummary = Pick<
  Building,
  "id" | "code" | "name" | "category" | "slug"
>;

export interface BuildingWithRooms extends Building {
  readonly rooms: readonly Room[];
}

export interface BuildingDetailsPayload extends BuildingWithRooms {
  readonly nearby?: readonly MapMarkerPayload[];
}