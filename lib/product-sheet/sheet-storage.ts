import { INITIAL_PRODUCT_SHEET_CARDS } from "./initial-data";
import {
  INITIAL_BRAND_STYLES,
  INITIAL_CARD_STYLES,
  INITIAL_SHEET_PRESETS,
} from "./baked-sheet-state";
import { cloneBrandStyles, cloneCardStyles, normalizeBrandStyles, normalizeCardStyles } from "./brand-styles";
import {
  createDefaultSheetStyle,
  mergeSheetStyle,
  migrateLegacySheetStyle,
  ProductSheetStyleConfig,
} from "./styles";
import { createSheetPreset, normalizeSheetPresets, ProductSheetPreset } from "./presets";
import { ProductSheetCardData } from "./types";

export const STORAGE_KEY = "product-sheet-state-v2";
export const STORAGE_BACKUP_KEY = "product-sheet-state-v2-backup";
export const LEGACY_CARDS_KEY = "product-sheet-cards-v1";

export type ProductSheetState = {
  cards: ProductSheetCardData[];
  globalStyle: ProductSheetStyleConfig;
  brandStyles: Record<string, ProductSheetStyleConfig>;
  cardStyles: Record<string, ProductSheetStyleConfig>;
  presets: ProductSheetPreset[];
};

export type StyleBaselines = {
  global: ProductSheetStyleConfig;
  brands: Record<string, ProductSheetStyleConfig>;
  cards: Record<string, ProductSheetStyleConfig>;
};

export type ProductSheetRepository = {
  load: () => ProductSheetState;
  save: (state: ProductSheetState) => void;
};

let persistReady = false;

export function markSheetStorageReady() {
  persistReady = true;
}

export function isSheetStorageReady() {
  return persistReady;
}

function loadLegacyCards(): ProductSheetCardData[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_CARDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductSheetCardData[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeBrandTypo(card: ProductSheetCardData): ProductSheetCardData {
  if (card.brand.startsWith("멜라논사")) {
    return { ...card, brand: card.brand.replace("멜라논사", "멜라노사") };
  }
  return card;
}

export function normalizeLoadedState(parsed: Partial<ProductSheetState>): ProductSheetState {
  const defaults = createDefaultSheetStyle();
  let globalStyle = migrateLegacySheetStyle(
    mergeSheetStyle(defaults, parsed.globalStyle ?? {})
  );
  if (globalStyle.pricePinBottom === 0) {
    globalStyle = mergeSheetStyle(globalStyle, { pricePinBottom: defaults.pricePinBottom });
  }
  if (globalStyle.headerRowHeight === 25) {
    globalStyle = mergeSheetStyle(globalStyle, { headerRowHeight: 22 });
  }
  const cards =
    Array.isArray(parsed.cards) && parsed.cards.length > 0
      ? parsed.cards.map(normalizeBrandTypo)
      : INITIAL_PRODUCT_SHEET_CARDS;
  const brandStyles = normalizeBrandStyles(parsed.brandStyles, globalStyle);

  return {
    cards,
    globalStyle,
    brandStyles,
    cardStyles: normalizeCardStyles(parsed.cardStyles, globalStyle, brandStyles, cards),
    presets: normalizeSheetPresets(parsed.presets),
  };
}

function tryParseState(raw: string | null): ProductSheetState | null {
  if (!raw) return null;
  try {
    return normalizeLoadedState(JSON.parse(raw) as Partial<ProductSheetState>);
  } catch {
    return null;
  }
}

export function createInitialState(): ProductSheetState {
  const globalStyle = createDefaultSheetStyle();
  const brandStyles = normalizeBrandStyles(INITIAL_BRAND_STYLES, globalStyle);
  return {
    cards: INITIAL_PRODUCT_SHEET_CARDS,
    globalStyle,
    brandStyles,
    cardStyles: normalizeCardStyles(INITIAL_CARD_STYLES, globalStyle, brandStyles, INITIAL_PRODUCT_SHEET_CARDS),
    presets: [...INITIAL_SHEET_PRESETS],
  };
}

export function loadProductSheetState(): ProductSheetState | null {
  if (typeof window === "undefined") return null;

  const primary = tryParseState(localStorage.getItem(STORAGE_KEY));
  if (primary) {
    markSheetStorageReady();
    return primary;
  }

  const backup = tryParseState(localStorage.getItem(STORAGE_BACKUP_KEY));
  if (backup) {
    markSheetStorageReady();
    saveProductSheetState(backup);
    return backup;
  }

  const legacy = loadLegacyCards();
  if (legacy) {
    markSheetStorageReady();
    return {
      cards: legacy.map(normalizeBrandTypo),
      globalStyle: createDefaultSheetStyle(),
      brandStyles: {},
      cardStyles: {},
      presets: [],
    };
  }

  return null;
}

export function saveProductSheetState(state: ProductSheetState) {
  if (typeof window === "undefined" || !persistReady) return;
  try {
    const raw = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, raw);
    localStorage.setItem(STORAGE_BACKUP_KEY, raw);
  } catch {
    /* quota */
  }
}

export function resetStoredProductSheetState(): ProductSheetState {
  const initial = createInitialState();
  markSheetStorageReady();
  saveProductSheetState(initial);
  return initial;
}

export function cloneStateBaselines(state: ProductSheetState) {
  return {
    global: { ...state.globalStyle },
    brands: cloneBrandStyles(state.brandStyles),
    cards: cloneCardStyles(state.cardStyles ?? {}),
  };
}
