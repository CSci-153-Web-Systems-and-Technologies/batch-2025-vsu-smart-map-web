import type { LatLng } from "@/lib/types";

export const MAP_DEFAULT_CENTER: LatLng = { lat: 10.74450, lng: 124.79194 }; // Approx VSU campus;
export const MAP_DEFAULT_ZOOM = 16;
export const MAP_MIN_ZOOM = 14;
export const MAP_MAX_ZOOM = 22;

export const MAP_TILES = {
  url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions">CARTO</a>',
};