import { z } from "zod";
import { FACILITY_TYPES, VALIDATION_LIMITS } from "@/lib/constants";

const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const facilitySchema = z.object({
  name: z.string().min(VALIDATION_LIMITS.facility.name.min).max(VALIDATION_LIMITS.facility.name.max),
  type: z.enum(FACILITY_TYPES),
  description: z.string().max(VALIDATION_LIMITS.facility.description.max).optional().or(z.literal("")),
  buildingId: z.string().uuid().optional().or(z.literal("")).nullable(),
  coordinates: coordsSchema,
  isActive: z.boolean().optional(),
});

export type FacilityFormValues = z.infer<typeof facilitySchema>;