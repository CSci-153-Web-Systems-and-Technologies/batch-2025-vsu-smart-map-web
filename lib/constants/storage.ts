export const STORAGE_BUCKETS = {
  facilityImages: "facility-images",
} as const;

export const STORAGE_PATHS = {
  facilityHero: (facilityId: string) =>
    `${STORAGE_BUCKETS.facilityImages}/${facilityId}/hero`,
  roomImage: (facilityId: string, roomId: string) =>
    `${STORAGE_BUCKETS.facilityImages}/${facilityId}/rooms/${roomId}`,
} as const;

export const STORAGE_LIMITS = {
  imageMaxMB: 3,
  acceptedTypes: ["image/png", "image/jpeg", "image/webp"] as const,
} as const;