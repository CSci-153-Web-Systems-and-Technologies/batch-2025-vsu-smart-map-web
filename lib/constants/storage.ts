export const STORAGE_BUCKETS = {
  facilityImages: "smartmap-bucket",
} as const;

export const STORAGE_PATHS = {
  facilityHero: (facilityId: string) =>
    `${STORAGE_BUCKETS.facilityImages}/${facilityId}/hero`,
  roomImage: (facilityId: string, roomId: string) =>
    `${STORAGE_BUCKETS.facilityImages}/${facilityId}/rooms/${roomId}`,
  suggestionImage: (tempId: string) =>
    `${STORAGE_BUCKETS.facilityImages}/suggestions/${tempId}`,
} as const;

export const STORAGE_LIMITS = {
  imageMaxMB: 5,
  acceptedTypes: ["image/png", "image/jpeg", "image/webp"] as const,
} as const;
