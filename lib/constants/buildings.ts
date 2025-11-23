import { COLORS } from "@/lib/design-tokens";

export const BUILDING_CATEGORIES = [
  "ACADEMIC",
  "ADMINISTRATIVE",
  "DORMITORY",
  "SERVICE",
  "SPORTS",
  "LABORATORY",
] as const;

export type BuildingCategory = (typeof BUILDING_CATEGORIES)[number];

export const BUILDING_CATEGORY_META: Record<
  BuildingCategory,
  { label: string; color: string; accent: string }
> = {
  ACADEMIC: { label: "Academic", color: COLORS.map.pinAcademic, accent: COLORS.primary.DEFAULT },
  ADMINISTRATIVE: { label: "Administrative", color: COLORS.neutral[700], accent: COLORS.primary.dark },
  DORMITORY: { label: "Dormitory", color: COLORS.map.pinDorm, accent: COLORS.status.warning },
  SERVICE: { label: "Service", color: COLORS.map.pinService, accent: COLORS.accent.DEFAULT },
  SPORTS: { label: "Sports", color: COLORS.status.info, accent: COLORS.primary.DEFAULT },
  LABORATORY: { label: "Laboratory", color: COLORS.status.info, accent: COLORS.primary.DEFAULT },
};