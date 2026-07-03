import { ProductSheetCardData } from "./types";

/** 선택 목록 — 같은 카드 ID를 여러 번 넣을 수 있음 (인쇄·미리보기용) */
export type SheetSelection = string[];

export function resolveSelectedCards(
  cards: ProductSheetCardData[],
  selection: SheetSelection
): ProductSheetCardData[] {
  return selection
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is ProductSheetCardData => Boolean(c));
}

export function selectionIncludes(selection: SheetSelection, id: string): boolean {
  return selection.includes(id);
}
