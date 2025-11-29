import { BUILDING_CATEGORY_META, type BuildingCategory } from "@/lib/constants/buildings";
import { FACILITY_TYPES, type FacilityType } from "@/lib/constants/facilities";

type PinKind = BuildingCategory | FacilityType;
type PinId =
  | "classroom"
  | "office"
  | "admin"
  | "registrar"
  | "cashier"
  | "ict"
  | "lab"
  | "library"
  | "dorm"
  | "canteen"
  | "clinic"
  | "restroom"
  | "court"
  | "gym"
  | "oval"
  | "stage"
  | "printing"
  | "water"
  | "gate"
  | "parking";

type PinOptions = {
  selected?: boolean;
  pinId?: PinId;
};

type PinAsset = {
  html: string;
  className: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
  tooltipAnchor: [number, number];
};

const PIN_SIZE: [number, number] = [40, 40];
const PIN_ANCHOR: [number, number] = [20, 40];
const TOOLTIP_ANCHOR: [number, number] = [0, -12];

const DEFAULT_PIN_FOR_CATEGORY: Record<BuildingCategory, PinId> = {
  ACADEMIC: "classroom",
  ADMINISTRATIVE: "admin",
  DORMITORY: "dorm",
  SERVICE: "office",
  SPORTS: "gym",
  LABORATORY: "lab",
};

const DEFAULT_PIN_FOR_FACILITY: Record<FacilityType, PinId> = {
  admin: "admin",
  registrar: "registrar",
  cashier: "cashier",
  ict: "ict",
  lab: "lab",
  library: "library",
  dorm: "dorm",
  canteen: "canteen",
  clinic: "clinic",
  restroom: "restroom",
  court: "court",
  gym: "gym",
  oval: "oval",
  stage: "stage",
  printing: "printing",
  water: "water",
  gate: "gate",
  parking: "parking",
  office: "office",
  classroom: "classroom",
};

const PIN_LIBRARY: Record<
  PinId,
  {
    color: string;
    inner: string;
  }
> = {
  classroom: {
    color: "#006A4E",
    inner: `
      <g fill="#fff">
        <rect x="18" y="18" width="18" height="12" rx="1" opacity="0.9"/>
        <path d="M22 32l-2 4h4l-2-4" stroke="#fff" stroke-width="2"/>
        <circle cx="42" cy="24" r="3.5"/> 
        <path d="M42 29c-3 0-4 2-4 5h8c0-3-1-5-4-5z"/>
      </g>
    `,
  },
  office: {
    color: "#006A4E",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="22" y="22" width="20" height="12" rx="2"/>
        <path d="M26 22v-3h12v3M22 28h20"/>
      </g>
    `,
  },
  admin: {
    color: "#FFB81C",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 23l12-7 12 7z"/>
        <rect x="22" y="23" width="20" height="12" rx="1.5"/>
        <path d="M26 23v12M32 23v12M38 23v12M20 37h24"/>
      </g>
    `,
  },
  registrar: {
    color: "#2563EB",
    inner: `
      <g fill="#fff">
        <rect x="20" y="20" width="24" height="16" rx="2"/>
        <circle cx="26.5" cy="26" r="3"/>
        <rect x="23" y="30" width="7" height="3" rx="1"/>
        <rect x="33" y="24" width="9" height="2" rx="1"/>
        <rect x="33" y="28" width="9" height="2" rx="1"/>
        <rect x="33" y="32" width="9" height="2" rx="1"/>
      </g>
    `,
  },
  cashier: {
    color: "#059669",
    inner: `
      <g fill="#fff">
        <rect x="21" y="20" width="22" height="14" rx="2"/>
        <rect x="23" y="23" width="14" height="2" rx="1"/>
        <rect x="23" y="27" width="18" height="2" rx="1"/>
        <rect x="23" y="31" width="10" height="2" rx="1"/>
      </g>
    `,
  },
  ict: {
    color: "#4F46E5",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="20" y="18" width="24" height="16" rx="2"/>
        <path d="M28 36h8M27 39h10"/>
      </g>
    `,
  },
  lab: {
    color: "#0891B2",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M28 18h8M30 18v9l-7 10h18l-7-10v-9"/>
        <path d="M26 30h12"/>
      </g>
    `,
  },
  library: {
    color: "#8B4513",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M24 19h8a4 4 0 0 1 4 4v13h-8a4 4 0 0 0-4 4V23a4 4 0 0 1 4-4z"/>
        <path d="M32 19h8a4 4 0 0 1 4 4v13h-8"/>
        <path d="M32 19v21"/>
      </g>
    `,
  },
  dorm: {
    color: "#FFB81C",
    inner: `
      <g fill="#fff" transform="translate(0, -3)">
        <path d="M20 30h24v-4a2 2 0 0 0-2-2H22a2 2 0 0 0-2 2v4z"/>
        <circle cx="26" cy="21" r="2.5"/>
        <rect x="20" y="30" width="4" height="5" rx="1"/>
        <rect x="40" y="30" width="4" height="5" rx="1"/>
      </g>
    `,
  },
  canteen: {
    color: "#EA580C",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M24 18v6M27 18v6M30 18v6M25.5 24v10"/>
        <path d="M40 18c-2 0-4 2-4 5 0 2 1 4 3 5v6M40 18c2 0 4 2 4 5 0 2-1 4-3 5v6"/>
      </g>
    `,
  },
  clinic: {
    color: "#DC2626",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M32 16v18M23 25h18"/>
      </g>
    `,
  },
  restroom: {
    color: "#0EA5E9",
    inner: `
      <g fill="#fff">
        <circle cx="24.5" cy="20.5" r="2.7"/>
        <rect x="21" y="24" width="7" height="10" rx="3"/>
        <circle cx="39.5" cy="20.5" r="2.7"/>
        <path d="M36 24h7v10a3 3 0 0 1-3.5 3h-0.9A3 3 0 0 1 36 34V24z"/>
        <rect x="31.5" y="18" width="1" height="16" rx="0.5"/>
      </g>
    `,
  },
  court: {
    color: "#0891B2",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="32" cy="24" r="10"/>
        <path d="M22 24h20M32 14v20M26 18c2.2 1.6 3.8 4 3.8 6s-1.6 4.4-3.8 6M38 18c-2.2 1.6-3.8 4-3.8 6s1.6 4.4 3.8 6"/>
      </g>
    `,
  },
  gym: {
    color: "#DC2626",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="20" y="22" width="6" height="10" rx="1.5"/>
        <rect x="38" y="22" width="6" height="10" rx="1.5"/>
        <path d="M26 27h12"/>
      </g>
    `,
  },
  oval: {
    color: "#16A34A",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="20" y="16" width="24" height="16" rx="8"/>
        <rect x="24" y="19" width="16" height="10" rx="5"/>
      </g>
    `,
  },
  stage: {
    color: "#9333EA",
    inner: `
      <g fill="#fff">
        <path d="M24 34l2-12h12l2 12H24z"/>
        <rect x="31" y="17" width="2" height="6" rx="1"/>
        <circle cx="32" cy="16" r="2"/>
      </g>
    `,
  },
  printing: {
    color: "#64748B",
    inner: `
      <g fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="24" y="16" width="16" height="6" rx="1.5"/>
        <rect x="22" y="24" width="20" height="10" rx="2"/>
        <rect x="26" y="31" width="12" height="6" rx="1.5"/>
        <path d="M28 27h2M34 27h2"/>
      </g>
    `,
  },
  water: {
    color: "#0EA5E9",
    inner: `
      <path d="M32 16c6 7 8 11 8 14a8 8 0 0 1-16 0c0-3 2-7 8-14z" fill="#fff"/>
    `,
  },
  gate: {
    color: "#64748B",
    inner: `
      <g fill="#fff">
        <rect x="20" y="20" width="4" height="14" rx="1"/>
        <rect x="40" y="20" width="4" height="14" rx="1"/>
        <rect x="20" y="18" width="24" height="3" rx="1"/>
        <path d="M24 24h16v8H24z" opacity="0.5"/>
      </g>
    `,
  },
  parking: {
    color: "#475569",
    inner: `
      <g fill="#fff">
        <circle cx="26" cy="26" r="7"/>
        <rect x="31" y="18" width="6" height="16" rx="2"/>
        <rect x="24" y="30" width="8" height="4" rx="1"/>
      </g>
    `,
  },
};

function resolvePinId(kind: PinKind): PinId {
  // Building categories map via default map; facility types map directly to pin ids by name
  if ((FACILITY_TYPES as readonly string[]).includes(kind as string)) {
    return DEFAULT_PIN_FOR_FACILITY[kind as FacilityType];
  }
  return DEFAULT_PIN_FOR_CATEGORY[kind as BuildingCategory];
}

function buildSvgPin(kind: PinKind, options: PinOptions): string {
  const pinId = options.pinId ?? resolvePinId(kind);
  const libraryPin = PIN_LIBRARY[pinId];
  const meta = BUILDING_CATEGORY_META[kind as BuildingCategory];
  const stroke = options.selected ? meta?.accent ?? "#ffffff" : "#ffffff";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 64 64" style="color: ${libraryPin.color};">
      <path d="M32 4c-12.15 0-22 9.85-22 22 0 15.6 22 34 22 34s22-18.4 22-34C54 13.85 44.15 4 32 4Z" fill="currentColor" stroke="${stroke}" stroke-width="3" />
      ${libraryPin.inner}
    </svg>
  `;
}

export function getPinAsset(kind: PinKind, options: PinOptions = {}): PinAsset {
  const html = buildSvgPin(kind, options);
  return {
    html,
    className: "vsu-pin",
    iconSize: PIN_SIZE,
    iconAnchor: PIN_ANCHOR,
    tooltipAnchor: TOOLTIP_ANCHOR,
  };
}