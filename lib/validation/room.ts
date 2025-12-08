import { z } from "zod";
import { VALIDATION_LIMITS } from "@/lib/constants";

export const roomSchema = z.object({
  facilityId: z.string().uuid(),
  roomCode: z
    .string()
    .min(VALIDATION_LIMITS.room.code.min)
    .max(VALIDATION_LIMITS.room.code.max),
  name: z.string().max(VALIDATION_LIMITS.room.name.max).optional().or(z.literal("")),
  description: z
    .string()
    .max(VALIDATION_LIMITS.room.description.max)
    .optional()
    .or(z.literal("")),
  floor: z.number().int().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type RoomFormValues = z.infer<typeof roomSchema>;