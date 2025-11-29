import type { MapItem } from "@/lib/types/map";
import type { BuildingCategory } from "@/lib/constants/buildings";
import type { FacilityType } from "@/lib/constants/facilities";

export function filterMapItems(
  items: readonly MapItem[],
  term: string,
  buildingCategory?: BuildingCategory | null,
  facilityTypes?: FacilityType[] | null,
) {
  const normalizedTerm = term.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const matchesBuildingCategory =
      item.kind === "building"
        ? buildingCategory
          ? item.category === buildingCategory
          : true
        : true;

    const matchesFacilityType =
      item.kind === "facility"
        ? facilityTypes && facilityTypes.length > 0
          ? item.facilityType && facilityTypes.includes(item.facilityType)
          : true
        : true;

    const matchesTerm =
      normalizedTerm.length === 0 ||
      item.name.toLowerCase().includes(normalizedTerm) ||
      (item.code ? item.code.toLowerCase().includes(normalizedTerm) : false);

    return matchesBuildingCategory && matchesFacilityType && matchesTerm;
  });

  return { results: filtered, matchCount: filtered.length };
}