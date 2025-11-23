import { z } from "zod";
import { SUBMISSION_STATUSES, VALIDATION_LIMITS } from "@/lib/constants";

export const submissionSchema = z.object({
  buildingName: z.string().min(1).max(VALIDATION_LIMITS.submission.name.max),
  locationDescription: z
    .string()
    .max(VALIDATION_LIMITS.submission.notes.max)
    .optional()
    .or(z.literal("")),
  additionalInfo: z
    .string()
    .max(VALIDATION_LIMITS.submission.notes.max)
    .optional()
    .or(z.literal("")),
  submitterName: z
    .string()
    .max(VALIDATION_LIMITS.submission.name.max)
    .optional()
    .or(z.literal("")),
  submitterEmail: z
    .string()
    .email()
    .max(VALIDATION_LIMITS.submission.email.max)
    .optional()
    .or(z.literal("")),
  status: z.enum(SUBMISSION_STATUSES).default("PENDING"),
  reviewNotes: z
    .string()
    .max(VALIDATION_LIMITS.submission.notes.max)
    .optional()
    .or(z.literal("")),
  buildingId: z.string().uuid().optional(),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;