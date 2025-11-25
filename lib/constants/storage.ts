export const STORAGE_BUCKETS = {
  buildingImages: "building-images",
} as const;

export const STORAGE_PATHS = {
  buildingHero: (buildingId: string) =>
    `${STORAGE_BUCKETS.buildingImages}/${buildingId}/hero`,
  roomImage: (buildingId: string, roomId: string) =>
    `${STORAGE_BUCKETS.buildingImages}/${buildingId}/rooms/${roomId}`,
} as const;

export const STORAGE_LIMITS = {
  imageMaxMB: 5,
  acceptedTypes: ["image/png", "image/jpeg", "image/webp"] as const,
} as const;