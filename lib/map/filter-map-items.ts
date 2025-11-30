import type { MapItem } from "@/lib/types/map";
import type { FacilityCategory } from "@/lib/types/facility";

export function filterMapItems(
  items: readonly MapItem[],
  term: string,
  selectedCategory?: FacilityCategory | null,
) {
  const normalizedTerm = term.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const matchesCategory = selectedCategory
      ? item.category === selectedCategory
      : true;

    const matchesTerm =
      normalizedTerm.length === 0 ||
      item.name.toLowerCase().includes(normalizedTerm) ||
      (item.code ? item.code.toLowerCase().includes(normalizedTerm) : false);

    return matchesCategory && matchesTerm;
  });

  return { results: filtered, matchCount: filtered.length };
}