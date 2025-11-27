import { BUILDING_CATEGORY_META, type BuildingCategory } from "@/lib/constants/buildings";

type PinOptions = {
  selected?: boolean;
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

function buildSvgPin(category: BuildingCategory, selected: boolean): string {
  const { color, accent } = BUILDING_CATEGORY_META[category];
  const stroke = selected ? accent : "#ffffff";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 64 64" style="color: ${color};">
      <path d="M32 4c-12.15 0-22 9.85-22 22 0 15.6 22 34 22 34s22-18.4 22-34C54 13.85 44.15 4 32 4Z" fill="currentColor" stroke="${stroke}" stroke-width="3" />
      <circle cx="32" cy="26" r="8" fill="#fff" opacity="0.85" />
    </svg>
  `;
}

export function getPinAsset(category: BuildingCategory, options: PinOptions = {}): PinAsset {
  const html = buildSvgPin(category, options.selected ?? false);
  return {
    html,
    className: "vsu-pin",
    iconSize: PIN_SIZE,
    iconAnchor: PIN_ANCHOR,
    tooltipAnchor: TOOLTIP_ANCHOR,
  };
}