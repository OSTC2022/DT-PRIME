import { buildCloneName } from "@/lib/product-clone";
import { ProductSheetCardData } from "./types";

export function nextSheetCardId(cards: ProductSheetCardData[]): string {
  let maxNum = 0;
  for (const { id } of cards) {
    const m = id.match(/^sheet-(\d+)$/);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  }
  return `sheet-${maxNum + 1}`;
}

export function cloneSheetCardData(
  cards: ProductSheetCardData[],
  source: ProductSheetCardData
): ProductSheetCardData {
  const titles = cards.map((c) => c.title);
  return {
    ...source,
    id: nextSheetCardId(cards),
    title: buildCloneName(titles, source.title),
    tags: source.tags ? [...source.tags] : undefined,
  };
}
