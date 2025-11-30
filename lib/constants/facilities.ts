import { COLORS } from "@/lib/design-tokens";
import type { FacilityCategory } from "@/lib/types/facility";

export interface FacilityCategoryMeta {
  label: string;
  color: string;
  pinAsset: string;
}

export const FACILITY_CATEGORY_META: Record<FacilityCategory, FacilityCategoryMeta> = {
  academic: {
    label: "Academic",
    color: COLORS.primary.DEFAULT,
    pinAsset: "/pins/academic.svg",
  },
  administrative: {
    label: "Administrative",
    color: COLORS.status.warning,
    pinAsset: "/pins/admin.svg",
  },
  research: {
    label: "Research",
    color: COLORS.primary.light,
    pinAsset: "/pins/research.svg",
  },
  office: {
    label: "Office",
    color: COLORS.neutral[700],
    pinAsset: "/pins/office.svg",
  },
  residential: {
    label: "Residential",
    color: COLORS.status.info,
    pinAsset: "/pins/dorm.svg",
  },
  dormitory: {
    label: "Dormitory",
    color: COLORS.status.info,
    pinAsset: "/pins/dorm.svg",
  },
  lodging: {
    label: "Lodging",
    color: COLORS.accent.DEFAULT,
    pinAsset: "/pins/lodging.svg",
  },
  sports: {
    label: "Sports",
    color: COLORS.status.success,
    pinAsset: "/pins/sports.svg",
  },
  dining: {
    label: "Dining",
    color: COLORS.status.warning,
    pinAsset: "/pins/dining.svg",
  },
  library: {
    label: "Library",
    color: COLORS.neutral[700],
    pinAsset: "/pins/library.svg",
  },
  medical: {
    label: "Medical",
    color: COLORS.status.danger,
    pinAsset: "/pins/medical.svg",
  },
  parking: {
    label: "Parking",
    color: COLORS.neutral[500],
    pinAsset: "/pins/parking.svg",
  },
  landmark: {
    label: "Landmark",
    color: COLORS.accent.DEFAULT,
    pinAsset: "/pins/landmark.svg",
  },
  religious: {
    label: "Religious",
    color: COLORS.primary.light,
    pinAsset: "/pins/religious.svg",
  },
  utility: {
    label: "Utility",
    color: COLORS.neutral[500],
    pinAsset: "/pins/utility.svg",
  },
  commercial: {
    label: "Commercial",
    color: COLORS.status.success,
    pinAsset: "/pins/commercial.svg",
  },
  transportation: {
    label: "Transportation",
    color: COLORS.status.info,
    pinAsset: "/pins/transport.svg",
  },
  atm: {
    label: "ATM",
    color: COLORS.status.success,
    pinAsset: "/pins/atm.svg",
  },
};

export function getCategoryMeta(category: FacilityCategory): FacilityCategoryMeta {
  return FACILITY_CATEGORY_META[category];
}

export function getCategoryLabel(category: FacilityCategory): string {
  return FACILITY_CATEGORY_META[category].label;
}

export function getCategoryColor(category: FacilityCategory): string {
  return FACILITY_CATEGORY_META[category].color;
}

export function getCategoryPinAsset(category: FacilityCategory): string {
  return FACILITY_CATEGORY_META[category].pinAsset;
}

/** @deprecated Use FacilityCategory from types/facility instead */
export const FACILITY_TYPES = [
  "admin","registrar","cashier","ict","lab","library","dorm","canteen","clinic","restroom",
  "court","gym","oval","stage","printing","water","gate","parking","office","classroom",
] as const;

/** @deprecated Use FacilityCategory from types/facility instead */
export type FacilityType = (typeof FACILITY_TYPES)[number];

/** @deprecated Use FACILITY_CATEGORY_META instead */
export const FACILITY_TYPE_META: Record<FacilityType, { label: string; color: string }> = {
  admin: { label: "Admin", color: COLORS.status.warning },
  registrar: { label: "Registrar", color: COLORS.status.info },
  cashier: { label: "Cashier", color: COLORS.status.success },
  ict: { label: "ICT", color: COLORS.primary.DEFAULT },
  lab: { label: "Lab", color: COLORS.status.info },
  library: { label: "Library", color: COLORS.neutral[700] },
  dorm: { label: "Dormitory", color: COLORS.status.warning },
  canteen: { label: "Canteen", color: COLORS.status.warning },
  clinic: { label: "Clinic", color: COLORS.status.danger },
  restroom: { label: "Restroom", color: COLORS.status.info },
  court: { label: "Court", color: COLORS.status.info },
  gym: { label: "Gym", color: COLORS.status.danger },
  oval: { label: "Oval", color: COLORS.status.success },
  stage: { label: "Stage", color: COLORS.primary.DEFAULT },
  printing: { label: "Printing", color: COLORS.neutral[500] },
  water: { label: "Water", color: COLORS.status.info },
  gate: { label: "Gate", color: COLORS.neutral[500] },
  parking: { label: "Parking", color: COLORS.neutral[700] },
  office: { label: "Office", color: COLORS.neutral[700] },
  classroom: { label: "Classroom", color: COLORS.accent.DEFAULT },
};
