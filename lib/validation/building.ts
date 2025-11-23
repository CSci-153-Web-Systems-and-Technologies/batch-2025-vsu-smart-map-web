import { z } from "zod";
import { BUILDING_CATEGORIES, VALIDATION_LIMITS, MAP_TILES } from "@/lib/constants";
import { MAP_DEFAULT_CENTER } from "@/lib/constants/map";

const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const contactSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

export const buildingSchema = z.object({
  code: z
    .string()
    .min(VALIDATION_LIMITS.building.code.min)
    .max(VALIDATION_LIMITS.building.code.max),
  name: z
    .string()
    .min(VALIDATION_LIMITS.building.name.min)
    .max(VALIDATION_LIMITS.building.name.max),
  description: z
    .string()
    .max(VALIDATION_LIMITS.building.description.max)
    .optional()
    .or(z.literal("")),
  category: z.enum(BUILDING_CATEGORIES),
  contacts: contactSchema.optional(),
  heroImage: z
    .object({
      src: z.string().url(),
      alt: z.string().min(1).max(160),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
    })
    .optional(),
  coordinates: coordsSchema.default(MAP_DEFAULT_CENTER),
  address: z
    .string()
    .max(VALIDATION_LIMITS.building.address.max)
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string().min(1).max(32)).optional(),
  isFeatured: z.boolean().optional(),
});

export type BuildingFormValues = z.infer<typeof buildingSchema>;
