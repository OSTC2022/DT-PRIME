"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultStyleBaselines,
  dualPriceSizePatch,
  hasExplicitSizePatch,
  pickStyleDiff,
  resolveBrandSheetStyle,
  resolveSheetCardStyle,
  SheetStyleTarget,
} from "./brand-styles";
import { cloneSheetCardData } from "./sheet-card-clone";
import { createSheetPreset, ProductSheetPreset } from "./presets";
import { SHEET_COLOR_THEMES } from "./colors";
import { hasDualPriceLines } from "./price-display";
import { mergeSheetStyle, ProductSheetStyleConfig } from "./styles";
import { ProductSheetCardData } from "./types";
import { SheetColorKey } from "./types";
import {
  cloneStateBaselines,
  clearLegacyStorage,
  clearStoredProductSheetState,
  createInitialState,
  hasCurrentVersionStorage,
  loadProductSheetState,
  markSheetStorageReady,
  MIGRATION_DISMISS_KEY,
  ProductSheetRepository,
  ProductSheetState,
  readLegacyStoredState,
  resetStoredProductSheetState,
  saveProductSheetState,
  StyleBaselines,
} from "./sheet-storage";
import { toast } from "sonner";

export type { ProductSheetRepository, ProductSheetState, StyleBaselines, SheetStyleTarget };

export function resetProductSheetState(): ProductSheetState {
  return resetStoredProductSheetState();
}

const localRepository: ProductSheetRepository = {
  load: () => loadProductSheetState() ?? createInitialState(),
  save: saveProductSheetState,
};

function resolveStyleForTarget(state: ProductSheetState, target: SheetStyleTarget): ProductSheetStyleConfig {
  if (target.scope === "global") return state.globalStyle;
  if (target.scope === "brand") {
    return resolveBrandSheetStyle(target.brand, state.globalStyle, state.brandStyles);
  }
  const card = state.cards.find((c) => c.id === target.cardId);
  return resolveSheetCardStyle(
    {
      id: target.cardId,
      brand: target.brand,
      price: card?.price,
      bottom: card?.bottom,
    },
    state.globalStyle,
    state.brandStyles,
    state.cardStyles
  );
}

export function useProductSheet(repository: ProductSheetRepository = localRepository) {
  const [state, setState] = useState<ProductSheetState>(createInitialState);
  const hydrated = useRef(false);
  const migrationChecked = useRef(false);
  const skipSaveRef = useRef(true);
  const styleBaselinesRef = useRef<StyleBaselines>(defaultStyleBaselines());

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const loaded = repository.load();
    styleBaselinesRef.current = cloneStateBaselines(loaded);
    setState(loaded);
    markSheetStorageReady();
  }, [repository]);

  useEffect(() => {
    if (!hydrated.current || migrationChecked.current) return;
    if (typeof window === "undefined") return;
    migrationChecked.current = true;

    if (hasCurrentVersionStorage()) return;
    if (sessionStorage.getItem(MIGRATION_DISMISS_KEY)) return;

    const legacy = readLegacyStoredState();
    if (!legacy) return;

    const restore = confirm(
      "이전에 저장한 제품 카드 데이터가 있습니다.\n\n확인: 이전 데이터 불러오기\n취소: 최신 기본 데이터 유지"
    );
    if (restore) {
      styleBaselinesRef.current = cloneStateBaselines(legacy);
      setState(legacy);
      markSheetStorageReady();
      saveProductSheetState(legacy);
      clearLegacyStorage();
      skipSaveRef.current = true;
      toast.success("이전 저장 데이터를 불러왔어요.");
      return;
    }

    sessionStorage.setItem(MIGRATION_DISMISS_KEY, "1");
    clearLegacyStorage();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    repository.save(state);
  }, [state, repository]);

  const applyDualPriceDefaults = (
    s: ProductSheetState,
    ids: string[],
    patch: Partial<ProductSheetCardData>
  ): Record<string, ProductSheetStyleConfig> => {
    if (!("price" in patch) && !("bottom" in patch)) return s.cardStyles;

    let nextCardStyles = s.cardStyles;
    for (const id of ids) {
      const source = s.cards.find((c) => c.id === id);
      if (!source) continue;
      const updated = { ...source, ...patch };
      if (!hasDualPriceLines(updated.price, updated.bottom)) continue;
      if (hasExplicitSizePatch(s.cardStyles[id])) continue;

      const brandBase = resolveBrandSheetStyle(updated.brand, s.globalStyle, s.brandStyles);
      const sizePatch = dualPriceSizePatch(brandBase, s.globalStyle);
      if (Object.keys(sizePatch).length === 0) continue;

      nextCardStyles = {
        ...nextCardStyles,
        [id]: { ...(nextCardStyles[id] ?? {}), ...sizePatch },
      };
    }
    return nextCardStyles;
  };

  const updateCard = useCallback((id: string, patch: Partial<ProductSheetCardData>) => {
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch, id } : c)),
      cardStyles: applyDualPriceDefaults(s, [id], patch),
    }));
  }, []);

  const updateCards = useCallback((ids: string[], patch: Partial<ProductSheetCardData>) => {
    const idSet = new Set(ids);
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) => (idSet.has(c.id) ? { ...c, ...patch, id: c.id } : c)),
      cardStyles: applyDualPriceDefaults(s, ids, patch),
    }));
  }, []);

  const cloneCardAfter = useCallback((id: string): string | null => {
    let newId: string | null = null;
    setState((s) => {
      const index = s.cards.findIndex((c) => c.id === id);
      if (index < 0) return s;

      const source = s.cards[index]!;
      const clone = cloneSheetCardData(s.cards, source);
      newId = clone.id;

      const nextCards = [...s.cards];
      nextCards.splice(index + 1, 0, clone);

      const sourceStyle = s.cardStyles[source.id];
      const nextCardStyles = sourceStyle
        ? { ...s.cardStyles, [clone.id]: { ...sourceStyle } }
        : s.cardStyles;

      return { ...s, cards: nextCards, cardStyles: nextCardStyles };
    });
    return newId;
  }, []);

  const deleteCards = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    if (idSet.size === 0) return;
    setState((s) => {
      const nextCardStyles = { ...s.cardStyles };
      for (const id of Array.from(idSet)) {
        delete nextCardStyles[id];
        delete styleBaselinesRef.current.cards[id];
      }
      return {
        ...s,
        cards: s.cards.filter((c) => !idSet.has(c.id)),
        cardStyles: nextCardStyles,
      };
    });
  }, []);

  const updateStyleForTarget = useCallback(
    (target: SheetStyleTarget, patch: Partial<ProductSheetStyleConfig>) => {
      setState((s) => {
        if (target.scope === "global") {
          return { ...s, globalStyle: mergeSheetStyle(s.globalStyle, patch) };
        }
        if (target.scope === "brand") {
          const resolved = mergeSheetStyle(
            resolveBrandSheetStyle(target.brand, s.globalStyle, s.brandStyles),
            patch
          );
          const diff = pickStyleDiff(s.globalStyle, resolved);
          const nextBrandStyles = { ...s.brandStyles };
          if (Object.keys(diff).length === 0) delete nextBrandStyles[target.brand];
          else nextBrandStyles[target.brand] = diff;
          return { ...s, brandStyles: nextBrandStyles };
        }
        const cardData = s.cards.find((c) => c.id === target.cardId);
        const brandBase = resolveBrandSheetStyle(target.brand, s.globalStyle, s.brandStyles);
        const resolved = mergeSheetStyle(
          resolveSheetCardStyle(
            {
              id: target.cardId,
              brand: target.brand,
              price: cardData?.price,
              bottom: cardData?.bottom,
            },
            s.globalStyle,
            s.brandStyles,
            s.cardStyles
          ),
          patch
        );
        const diff = pickStyleDiff(brandBase, resolved);
        const nextCardStyles = { ...s.cardStyles };
        if (Object.keys(diff).length === 0) delete nextCardStyles[target.cardId];
        else nextCardStyles[target.cardId] = diff;
        return { ...s, cardStyles: nextCardStyles };
      });
    },
    []
  );

  const savePreset = useCallback((name: string, category: string, target: SheetStyleTarget) => {
    setState((s) => {
      const style = resolveStyleForTarget(s, target);
      if (target.scope === "brand") {
        styleBaselinesRef.current.brands[target.brand] = { ...style };
      } else if (target.scope === "card") {
        styleBaselinesRef.current.cards[target.cardId] = { ...style };
      } else {
        styleBaselinesRef.current.global = { ...style };
      }
      return {
        ...s,
        presets: [createSheetPreset(name, category, style), ...s.presets],
      };
    });
  }, []);

  const removePreset = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      presets: s.presets.filter((p) => p.id !== id),
    }));
  }, []);

  const applyPreset = useCallback((preset: ProductSheetPreset, target: SheetStyleTarget) => {
    setState((s) => {
      if (target.scope === "brand") {
        styleBaselinesRef.current.brands[target.brand] = { ...preset.style };
        const diff = pickStyleDiff(s.globalStyle, preset.style);
        const nextBrandStyles = { ...s.brandStyles };
        if (Object.keys(diff).length === 0) delete nextBrandStyles[target.brand];
        else nextBrandStyles[target.brand] = diff;
        return { ...s, brandStyles: nextBrandStyles };
      }
      if (target.scope === "card") {
        styleBaselinesRef.current.cards[target.cardId] = { ...preset.style };
        const brandBase = resolveBrandSheetStyle(target.brand, s.globalStyle, s.brandStyles);
        const diff = pickStyleDiff(brandBase, preset.style);
        const nextCardStyles = { ...s.cardStyles };
        if (Object.keys(diff).length === 0) delete nextCardStyles[target.cardId];
        else nextCardStyles[target.cardId] = diff;
        return { ...s, cardStyles: nextCardStyles };
      }
      styleBaselinesRef.current.global = { ...preset.style };
      return { ...s, globalStyle: { ...preset.style } };
    });
  }, []);

  const resetStyleForTarget = useCallback((target: SheetStyleTarget) => {
    setState((s) => {
      if (target.scope === "global") {
        return { ...s, globalStyle: { ...styleBaselinesRef.current.global } };
      }
      if (target.scope === "brand") {
        const baseline = styleBaselinesRef.current.brands[target.brand];
        if (baseline) {
          const diff = pickStyleDiff(s.globalStyle, baseline);
          const nextBrandStyles = { ...s.brandStyles };
          if (Object.keys(diff).length === 0) delete nextBrandStyles[target.brand];
          else nextBrandStyles[target.brand] = diff;
          return { ...s, brandStyles: nextBrandStyles };
        }
        const next = { ...s.brandStyles };
        delete next[target.brand];
        return { ...s, brandStyles: next };
      }
      const baseline = styleBaselinesRef.current.cards[target.cardId];
      if (baseline) {
        const brandBase = resolveBrandSheetStyle(target.brand, s.globalStyle, s.brandStyles);
        const diff = pickStyleDiff(brandBase, baseline);
        const nextCardStyles = { ...s.cardStyles };
        if (Object.keys(diff).length === 0) delete nextCardStyles[target.cardId];
        else nextCardStyles[target.cardId] = diff;
        return { ...s, cardStyles: nextCardStyles };
      }
      const next = { ...s.cardStyles };
      delete next[target.cardId];
      return { ...s, cardStyles: next };
    });
  }, []);

  const clearBrandStyleOverride = useCallback((brand: string) => {
    setState((s) => {
      const next = { ...s.brandStyles };
      delete next[brand];
      delete styleBaselinesRef.current.brands[brand];
      return { ...s, brandStyles: next };
    });
  }, []);

  const clearCardStyleOverride = useCallback((cardId: string) => {
    setState((s) => {
      const next = { ...s.cardStyles };
      delete next[cardId];
      delete styleBaselinesRef.current.cards[cardId];
      return { ...s, cardStyles: next };
    });
  }, []);

  const resetToInitial = useCallback(() => {
    const initial = resetProductSheetState();
    styleBaselinesRef.current = cloneStateBaselines(initial);
    setState(initial);
    skipSaveRef.current = true;
  }, []);

  const clearSavedData = useCallback(() => {
    clearStoredProductSheetState();
  }, []);

  const saveCurrentState = useCallback(() => {
    markSheetStorageReady();
    saveProductSheetState(state);
    skipSaveRef.current = true;
    toast.success("현재 상태를 저장했어요.");
  }, [state]);

  const resolveBrandStyle = useCallback(
    (brand: string) => resolveBrandSheetStyle(brand, state.globalStyle, state.brandStyles),
    [state.globalStyle, state.brandStyles]
  );

  const resolveCardStyle = useCallback(
    (card: Pick<ProductSheetCardData, "id" | "brand" | "price" | "bottom">) =>
      resolveSheetCardStyle(card, state.globalStyle, state.brandStyles, state.cardStyles),
    [state.globalStyle, state.brandStyles, state.cardStyles]
  );

  return {
    cards: state.cards,
    globalStyle: state.globalStyle,
    brandStyles: state.brandStyles,
    cardStyles: state.cardStyles,
    presets: state.presets,
    updateCard,
    updateCards,
    cloneCardAfter,
    deleteCards,
    updateStyleForTarget,
    resetStyleForTarget,
    clearBrandStyleOverride,
    clearCardStyleOverride,
    resolveBrandStyle,
    resolveCardStyle,
    savePreset,
    removePreset,
    applyPreset,
    resetToInitial,
    clearSavedData,
    saveCurrentState,
  };
}

export type ProductSheetFilters = {
  query: string;
  brand: string;
  color: string;
};

export function filterProductSheetCards(
  cards: ProductSheetCardData[],
  filters: ProductSheetFilters
): ProductSheetCardData[] {
  const q = filters.query.trim().toLowerCase();
  return cards.filter((card) => {
    if (filters.brand && card.brand !== filters.brand) return false;
    if (filters.color && card.color !== filters.color) return false;
    if (!q) return true;
    const haystack = [
      card.brand,
      card.line,
      card.title,
      card.highlight,
      card.bottom,
      card.price,
      ...(card.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

const SHEET_COLOR_SORT_ORDER = Object.keys(SHEET_COLOR_THEMES) as SheetColorKey[];
const PRIORITY_BRANDS = ["유쏘랩"];

function brandSortIndex(brand: string): number {
  const idx = PRIORITY_BRANDS.indexOf(brand);
  return idx >= 0 ? idx : PRIORITY_BRANDS.length;
}

function colorSortIndex(color?: SheetColorKey): number {
  const idx = SHEET_COLOR_SORT_ORDER.indexOf(color ?? "repair");
  return idx >= 0 ? idx : SHEET_COLOR_SORT_ORDER.length;
}

/** 그리드 표시 순: 브랜드(유쏘랩 우선) → 색상 → 제품명 */
export function sortProductSheetCards(cards: ProductSheetCardData[]): ProductSheetCardData[] {
  return [...cards].sort((a, b) => {
    const byBrandPriority = brandSortIndex(a.brand) - brandSortIndex(b.brand);
    if (byBrandPriority !== 0) return byBrandPriority;

    const byBrand = a.brand.localeCompare(b.brand, "ko");
    if (byBrand !== 0) return byBrand;

    const byColor = colorSortIndex(a.color) - colorSortIndex(b.color);
    if (byColor !== 0) return byColor;

    const byTitle = a.title.localeCompare(b.title, "ko");
    if (byTitle !== 0) return byTitle;

    return (a.highlight ?? "").localeCompare(b.highlight ?? "", "ko");
  });
}

export function collectSheetBrands(cards: ProductSheetCardData[]): string[] {
  const set = new Set<string>();
  for (const c of cards) if (c.brand) set.add(c.brand);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

export function collectSheetColors(cards: ProductSheetCardData[]): SheetColorKey[] {
  const set = new Set<SheetColorKey>();
  for (const c of cards) if (c.color) set.add(c.color);
  return Array.from(set);
}
