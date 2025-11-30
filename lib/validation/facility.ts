import { z } from "zod";
import { FACILITY_CATEGORIES } from "@/lib/types/facility";
import { VALIDATION_LIMITS } from "@/lib/constants";

const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Base facility schema with common fields.
 */
const baseFacilitySchema = z.object({
  name: z.string().min(VALIDATION_LIMITS.facility.name.min).max(VALIDATION_LIMITS.facility.name.max),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(VALIDATION_LIMITS.facility.description.max).optional().or(z.literal("")),
  category: z.enum(FACILITY_CATEGORIES),
  coordinates: coordsSchema,
  imageUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * Schema for facilities with rooms (buildings).
 */
export const facilityWithRoomsSchema = baseFacilitySchema.extend({
  hasRooms: z.literal(true),
});

/**
 * Schema for facilities without rooms (POIs).
 */
export const facilityPOISchema = baseFacilitySchema.extend({
  hasRooms: z.literal(false),
});

/**
 * Unified facility schema using discriminated union on hasRooms.
 */
export const unifiedFacilitySchema = z.discriminatedUnion("hasRooms", [
  facilityWithRoomsSchema,
  facilityPOISchema,
]);

export type UnifiedFacilityFormValues = z.infer<typeof unifiedFacilitySchema>;
export type FacilityWithRoomsFormValues = z.infer<typeof facilityWithRoomsSchema>;
export type FacilityPOIFormValues = z.infer<typeof facilityPOISchema>;

// ============ Deprecated - for backward compatibility ============

import { FACILITY_TYPES } from "@/lib/constants/facilities";

/** @deprecated Use unifiedFacilitySchema instead */
export const facilitySchema = z.object({
  name: z.string().min(VALIDATION_LIMITS.facility.name.min).max(VALIDATION_LIMITS.facility.name.max),
  type: z.enum(FACILITY_TYPES),
  description: z.string().max(VALIDATION_LIMITS.facility.description.max).optional().or(z.literal("")),
  buildingId: z.string().uuid().optional().or(z.literal("")).nullable(),
  coordinates: coordsSchema,
  isActive: z.boolean().optional(),
});

/** @deprecated Use UnifiedFacilityFormValues instead */
export type FacilityFormValues = z.infer<typeof facilitySchema>;
