import type { MapItem } from "@/lib/types/map";
import type { FacilityCategory } from "@/lib/types/facility";

export function filterMapItems(
  items: readonly MapItem[],
  term: string,
  selectedCategory?: FacilityCategory | null,
  roomMatchedIds?: Set<string>,
) {
  const normalizedTerm = term.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const matchesCategory = selectedCategory
      ? item.category === selectedCategory
      : true;

    const matchesFacilityTerm =
      normalizedTerm.length === 0 ||
      item.name.toLowerCase().includes(normalizedTerm) ||
      (item.code ? item.code.toLowerCase().includes(normalizedTerm) : false);

    const matchesRoomSearch = roomMatchedIds?.has(item.id) ?? false;

    const matchesTerm = matchesFacilityTerm || matchesRoomSearch;

    return matchesCategory && matchesTerm;
  });

  return { results: filtered, matchCount: filtered.length };
}