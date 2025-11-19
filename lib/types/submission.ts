import type { AuditFields } from "./common";

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Submission extends AuditFields {
  readonly id: string;
  readonly buildingName: string;
  readonly locationDescription?: string;
  readonly additionalInfo?: string;
  readonly submitterName?: string;
  readonly submitterEmail?: string;
  readonly status: SubmissionStatus;
  readonly reviewNotes?: string;
  readonly buildingId?: string;
}

export interface SubmissionSummary
  extends Pick<Submission, "id" | "buildingName" | "status" | "createdAt"> {}