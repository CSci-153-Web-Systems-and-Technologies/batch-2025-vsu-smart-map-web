import { COLORS } from "@/lib/design-tokens";

export const FACILITY_TYPES = [
  "admin","registrar","cashier","ict","lab","library","dorm","canteen","clinic","restroom",
  "court","gym","oval","stage","printing","water","gate","parking","office","classroom",
] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

export const FACILITY_TYPE_META: Record<
  FacilityType,
  { label: string; color: string }
> = {
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