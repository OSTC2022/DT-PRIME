"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductSheetSelectedBatchEditor } from "@/components/product-sheet/product-sheet-selected-batch-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import { ProductSheetCardData } from "@/lib/product-sheet/types";
import {
  resolveSelectedCards,
  selectionIncludes,
  SheetSelection,
} from "@/lib/product-sheet/selection";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Pencil, Search } from "lucide-react";

type BrandGroup = {
  brand: string;
  cards: ProductSheetCardData[];
};

export function ProductSheetIndividualSection({
  cards,
  globalStyle,
  resolveCardStyle,
  selection,
  onSelectionChange,
  onFocusIdChange,
  updateCards,
  panelExpandTick,
}: {
  cards: ProductSheetCardData[];
  globalStyle: ProductSheetStyleConfig;
  resolveCardStyle: (card: ProductSheetCardData) => ProductSheetStyleConfig;
  selection: SheetSelection;
  onSelectionChange: (selection: SheetSelection) => void;
  onFocusIdChange: (id: string | null) => void;
  updateCards: (ids: string[], patch: Partial<ProductSheetCardData>) => void;
  panelExpandTick?: number;
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (panelExpandTick) {
      setPanelOpen(true);
      setPickerOpen(true);
    }
  }, [panelExpandTick]);

  const brandGroups = useMemo(() => {
    const map = new Map<string, ProductSheetCardData[]>();
    for (const card of cards) {
      const brand = card.brand.trim() || "(미지정)";
      const list = map.get(brand) ?? [];
      list.push(card);
      map.set(brand, list);
    }
    return Array.from(map.entries())
      .map(([brand, groupCards]) => ({ brand, cards: groupCards }))
      .sort((a, b) => a.brand.localeCompare(b.brand, "ko"));
  }, [cards]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brandGroups;
    return brandGroups
      .map((g) => ({
        ...g,
        cards: g.cards.filter((c) => cardLabel(c).toLowerCase().includes(q)),
      }))
      .filter((g) => g.cards.length > 0);
  }, [brandGroups, query]);

  const uniqueSelectedCards = useMemo(() => {
    const seen = new Set<string>();
    return resolveSelectedCards(cards, selection).filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [cards, selection]);

  const toggleCard = (id: string) => {
    if (selectionIncludes(selection, id)) {
      onSelectionChange(selection.filter((x) => x !== id));
    } else {
      onSelectionChange([...selection, id]);
    }
  };

  const toggleBrand = (group: BrandGroup) => {
    const ids = group.cards.map((c) => c.id);
    const allOn = ids.every((id) => selectionIncludes(selection, id));
    if (allOn) {
      onSelectionChange(selection.filter((x) => !ids.includes(x)));
    } else {
      const missing = ids.filter((id) => !selectionIncludes(selection, id));
      onSelectionChange([...selection, ...missing]);
    }
  };

  const selectAll = () => onSelectionChange(cards.map((c) => c.id));
  const clearAll = () => {
    onSelectionChange([]);
    onFocusIdChange(null);
  };

  return (
    <div className="no-print mb-6 rounded-xl border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <Pencil className="size-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-black">선택 일괄 편집</h2>
            <p className="text-xs text-muted-foreground">
              선택한 카드 내용(브랜드·제품명·가격 등)을 일괄 수정합니다. ({selection.length}개 선택)
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-muted-foreground">
          {panelOpen ? (
            <>
              <ChevronUp className="size-4" /> 접기
            </>
          ) : (
            <>
              <ChevronDown className="size-4" /> 펼치기
            </>
          )}
        </span>
      </button>

      {panelOpen ? (
        <div className="p-4">
          <div className="mb-4 rounded-lg border bg-muted/10">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
            >
              <span className="text-xs font-black text-muted-foreground">편집할 카드 선택</span>
              {pickerOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {pickerOpen ? (
              <div className="space-y-3 border-t px-3 pb-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={selectAll}>
                    전체 선택
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={clearAll}>
                    선택 해제
                  </Button>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="브랜드 · 제품명 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-9 pl-8"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {brandGroups.map((g) => {
                    const ids = g.cards.map((c) => c.id);
                    const allOn = ids.every((id) => selectionIncludes(selection, id));
                    const someOn = !allOn && ids.some((id) => selectionIncludes(selection, id));
                    return (
                      <button
                        key={g.brand}
                        type="button"
                        onClick={() => toggleBrand(g)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors",
                          allOn
                            ? "border-primary bg-primary text-primary-foreground"
                            : someOn
                            ? "border-primary/50 bg-primary/15 text-primary"
                            : "bg-background hover:bg-muted"
                        )}
                      >
                        {g.brand} ({g.cards.length})
                      </button>
                    );
                  })}
                </div>

                <div className="max-h-56 space-y-3 overflow-y-auto rounded-md border bg-background p-2">
                  {filteredGroups.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">검색 결과가 없어요.</p>
                  ) : (
                    filteredGroups.map((g) => (
                      <div key={g.brand}>
                        <p className="mb-1 text-[10px] font-black text-muted-foreground">{g.brand}</p>
                        <div className="space-y-1">
                          {g.cards.map((card) => (
                            <label
                              key={card.id}
                              className={cn(
                                "flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-[11px] hover:bg-muted/60",
                                selectionIncludes(selection, card.id) && "bg-primary/10"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selectionIncludes(selection, card.id)}
                                onChange={() => toggleCard(card.id)}
                                className="mt-0.5 size-3.5 accent-primary"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="font-bold">{card.title}</span>
                                {card.highlight ? (
                                  <span className="text-muted-foreground"> · {card.highlight}</span>
                                ) : null}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {uniqueSelectedCards.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              편집할 카드를 위에서 선택하거나, 아래 그리드에서 카드를 클릭하세요.
            </p>
          ) : (
            <ProductSheetSelectedBatchEditor
              cards={uniqueSelectedCards}
              style={
                uniqueSelectedCards[0]
                  ? resolveCardStyle(uniqueSelectedCards[0])
                  : globalStyle
              }
              onApply={(patch) => updateCards(uniqueSelectedCards.map((c) => c.id), patch)}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function cardLabel(card: ProductSheetCardData) {
  return [card.brand, card.line, card.title, card.highlight, ...(card.tags ?? [])]
    .filter(Boolean)
    .join(" ");
}
