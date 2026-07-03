import {
  createDefaultSheetStyle,
  mergeSheetStyle,
  migrateLegacySheetStyle,
  ProductSheetStyleConfig,
} from "./styles";
import { hasDualPriceLines } from "./price-display";
import { ProductSheetCardData, SHEET_CARD_HEIGHT_DUAL, SHEET_CARD_WIDTH } from "./types";

/** 일괄 편집에서 '전체' 선택 시 null */
export type BrandStyleTarget = string | null;

export type SheetStyleScope = "global" | "brand" | "card";

export type SheetStyleTarget =
  | { scope: "global" }
  | { scope: "brand"; brand: string }
  | { scope: "card"; cardId: string; brand: string };

/** base 대비 달라진 필드만 남김 — 브랜드·카드 스타일은 차이(patch)만 저장 */
export function pickStyleDiff(
  base: ProductSheetStyleConfig,
  style: ProductSheetStyleConfig
): ProductSheetStyleConfig {
  const patch = {} as ProductSheetStyleConfig;
  for (const key of Object.keys(base) as (keyof ProductSheetStyleConfig)[]) {
    if (style[key] !== base[key]) {
      (patch as Record<string, unknown>)[key] = style[key];
    }
  }
  return patch;
}

export function resolveBrandSheetStyle(
  brand: string,
  globalStyle: ProductSheetStyleConfig,
  brandStyles: Record<string, ProductSheetStyleConfig>
): ProductSheetStyleConfig {
  if (!brand) return globalStyle;
  const patch = brandStyles[brand];
  if (!patch) return globalStyle;
  return mergeSheetStyle(globalStyle, patch);
}

function applyDualPriceCardSize(
  style: ProductSheetStyleConfig,
  base: ProductSheetStyleConfig
): ProductSheetStyleConfig {
  const cellHeight = Math.round((base.cellHeight * SHEET_CARD_HEIGHT_DUAL) / base.height);
  return mergeSheetStyle(style, {
    width: SHEET_CARD_WIDTH,
    height: SHEET_CARD_HEIGHT_DUAL,
    cellHeight,
  });
}

export function resolveSheetCardStyle(
  card: Pick<ProductSheetCardData, "id" | "brand" | "price" | "bottom">,
  globalStyle: ProductSheetStyleConfig,
  brandStyles: Record<string, ProductSheetStyleConfig>,
  cardStyles: Record<string, ProductSheetStyleConfig> = {}
): ProductSheetStyleConfig {
  const brandBase = resolveBrandSheetStyle(card.brand, globalStyle, brandStyles);
  const patch = cardStyles[card.id];
  let resolved = patch ? mergeSheetStyle(brandBase, patch) : brandBase;

  if (hasDualPriceLines(card.price, card.bottom)) {
    resolved = applyDualPriceCardSize(resolved, globalStyle);
  }

  return resolved;
}

export function normalizeBrandStyles(
  raw: unknown,
  globalStyle: ProductSheetStyleConfig
): Record<string, ProductSheetStyleConfig> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, ProductSheetStyleConfig> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!key.trim() || !val || typeof val !== "object") continue;
    const merged = migrateLegacySheetStyle(
      mergeSheetStyle(globalStyle, val as Partial<ProductSheetStyleConfig>)
    );
    const patch = pickStyleDiff(globalStyle, merged);
    if ("pricePinBottom" in patch && patch.pricePinBottom === 0) {
      delete (patch as Partial<ProductSheetStyleConfig>).pricePinBottom;
    }
    if (patch.headerRowHeight === 25 || patch.headerRowHeight === globalStyle.headerRowHeight) {
      delete (patch as Partial<ProductSheetStyleConfig>).headerRowHeight;
    }
    if (Object.keys(patch).length > 0) out[key] = patch;
  }
  return out;
}

export function normalizeCardStyles(
  raw: unknown,
  globalStyle: ProductSheetStyleConfig,
  brandStyles: Record<string, ProductSheetStyleConfig>,
  cards: ProductSheetCardData[]
): Record<string, ProductSheetStyleConfig> {
  if (!raw || typeof raw !== "object") return {};
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const out: Record<string, ProductSheetStyleConfig> = {};
  for (const [cardId, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!cardId.trim() || !val || typeof val !== "object") continue;
    const card = cardById.get(cardId);
    if (!card) continue;
    const brandBase = resolveBrandSheetStyle(card.brand, globalStyle, brandStyles);
    const merged = migrateLegacySheetStyle(
      mergeSheetStyle(brandBase, val as Partial<ProductSheetStyleConfig>)
    );
    const patch = pickStyleDiff(brandBase, merged);
    if (patch.headerRowHeight === 25 || patch.headerRowHeight === brandBase.headerRowHeight) {
      delete (patch as Partial<ProductSheetStyleConfig>).headerRowHeight;
    }
    if (Object.keys(patch).length > 0) out[cardId] = patch;
  }
  return out;
}

export function hasBrandStyleOverride(
  brand: string,
  brandStyles: Record<string, ProductSheetStyleConfig>
): boolean {
  return Object.prototype.hasOwnProperty.call(brandStyles, brand);
}

export function hasCardStyleOverride(
  cardId: string,
  cardStyles: Record<string, ProductSheetStyleConfig>
): boolean {
  return Object.prototype.hasOwnProperty.call(cardStyles, cardId);
}

export function cloneBrandStyles(
  brandStyles: Record<string, ProductSheetStyleConfig>
): Record<string, ProductSheetStyleConfig> {
  return Object.fromEntries(
    Object.entries(brandStyles).map(([k, v]) => [k, { ...v }])
  );
}

export function cloneCardStyles(
  cardStyles: Record<string, ProductSheetStyleConfig>
): Record<string, ProductSheetStyleConfig> {
  return Object.fromEntries(
    Object.entries(cardStyles).map(([k, v]) => [k, { ...v }])
  );
}

export function emptyBrandStylesBaseline(): Record<string, ProductSheetStyleConfig> {
  return {};
}

export function defaultStyleBaselines() {
  const defaults = createDefaultSheetStyle();
  return { global: { ...defaults }, brands: emptyBrandStylesBaseline(), cards: {} };
}
