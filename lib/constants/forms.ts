export const VALIDATION_LIMITS = {
  building: {
    code: { min: 2, max: 24 },
    name: { min: 3, max: 120 },
    description: { max: 800 },
    address: { max: 160 },
  },
  room: {
    code: { min: 1, max: 16 },
    name: { max: 120 },
    description: { max: 400 },
  },
  submission: {
    name: { max: 80 },
    email: { max: 120 },
    notes: { max: 500 },
  },
  storage: {
    imageMaxMB: 5,
    acceptedTypes: ["image/png", "image/jpeg", "image/webp"] as const,
  },
} as const;
