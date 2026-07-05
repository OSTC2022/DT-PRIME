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
import {
  DEFAULT_UI_STATE,
  parseSnapshotPayload,
  ProductCardTemplateSnapshot,
  snapshotFromScreen,
  stateFromSnapshot,
} from "./sheet-snapshot";
import type { ProductSheetUiState } from "./sheet-snapshot";
import {
  LEGACY_STORAGE_KEYS,
  MIGRATION_DISMISS_KEY,
  PRODUCT_CARD_TEMPLATE_STORAGE_KEY,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
  UI_STORAGE_KEY,
} from "./storage-keys";
import { clearSyncMeta } from "./sheet-cloud-sync";

export {
  BACKUP_FILE_VERSION,
  LEGACY_STORAGE_KEYS,
  MIGRATION_DISMISS_KEY,
  PRODUCT_CARD_TEMPLATE_STORAGE_KEY,
  PRODUCT_CARD_TEMPLATE_STORAGE_KEYS,
  PRODUCT_CARD_TEMPLATE_STORAGE_VERSION,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
  UI_STORAGE_KEY,
} from "./storage-keys";

export type { ProductSheetUiState, ProductCardTemplateSnapshot } from "./sheet-snapshot";
export { DEFAULT_UI_STATE, snapshotFromScreen, stateFromSnapshot, logSnapshotVerification } from "./sheet-snapshot";

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

function removeLegacyStorageKeys() {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem(STORAGE_BACKUP_KEY);
  localStorage.removeItem(UI_STORAGE_KEY);
}

export function hasCurrentVersionStorage(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(PRODUCT_CARD_TEMPLATE_STORAGE_KEY);
}

function tryParseSnapshotRaw(raw: string | null): ProductCardTemplateSnapshot | null {
  if (!raw) return null;
  try {
    return parseSnapshotPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

function migrateV3ToSnapshot(): ProductCardTemplateSnapshot | null {
  if (typeof window === "undefined") return null;

  const v3State = localStorage.getItem("product-card-template-v3");
  const v3Backup = localStorage.getItem(STORAGE_BACKUP_KEY);
  const stateRaw = v3State ?? v3Backup;
  if (!stateRaw) return null;

  try {
    const parsed = JSON.parse(stateRaw) as Partial<ProductSheetState>;
    const state = normalizeLoadedState(parsed);
    let ui = DEFAULT_UI_STATE;
    const uiRaw = localStorage.getItem(UI_STORAGE_KEY);
    if (uiRaw) {
      const uiParsed = parseSnapshotPayload({ ui: JSON.parse(uiRaw) });
      if (uiParsed) ui = uiParsed.ui;
    }
    return snapshotFromScreen(state, ui);
  } catch {
    return null;
  }
}

export function loadPersistedSnapshot(): ProductCardTemplateSnapshot | null {
  if (typeof window === "undefined") return null;

  const current = tryParseSnapshotRaw(localStorage.getItem(PRODUCT_CARD_TEMPLATE_STORAGE_KEY));
  if (current) {
    markSheetStorageReady();
    return current;
  }

  const migrated = migrateV3ToSnapshot();
  if (migrated) {
    persistSnapshot(migrated, { force: true });
    removeLegacyStorageKeys();
    markSheetStorageReady();
    return migrated;
  }

  return null;
}

export function readLegacyStoredState(): ProductSheetState | null {
  if (typeof window === "undefined") return null;
  for (const key of LEGACY_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const snapshot = tryParseSnapshotRaw(raw) ?? parseSnapshotPayload(JSON.parse(raw));
    if (snapshot) return stateFromSnapshot(snapshot);
    try {
      return normalizeLoadedState(JSON.parse(raw) as Partial<ProductSheetState>);
    } catch {
      continue;
    }
  }
  return null;
}

export function clearLegacyStorage() {
  removeLegacyStorageKeys();
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
  const snapshot = loadPersistedSnapshot();
  if (!snapshot) return null;
  return stateFromSnapshot(snapshot);
}

export function loadProductSheetUiState(): ProductSheetUiState {
  const snapshot = loadPersistedSnapshot();
  return snapshot?.ui ?? { ...DEFAULT_UI_STATE };
}

export function persistSnapshot(
  snapshot: ProductCardTemplateSnapshot,
  options?: { force?: boolean }
) {
  if (typeof window === "undefined") return;
  if (!options?.force && !persistReady) return;
  try {
    markSheetStorageReady();
    localStorage.setItem(PRODUCT_CARD_TEMPLATE_STORAGE_KEY, JSON.stringify(snapshot));
    removeLegacyStorageKeys();
  } catch {
    /* quota */
  }
}

export function saveProductSheetState(state: ProductSheetState) {
  if (typeof window === "undefined" || !persistReady) return;
  const existing = tryParseSnapshotRaw(localStorage.getItem(PRODUCT_CARD_TEMPLATE_STORAGE_KEY));
  const ui = existing?.ui ?? { ...DEFAULT_UI_STATE };
  persistSnapshot(snapshotFromScreen(state, ui));
}

export function saveProductSheetUiState(ui: ProductSheetUiState) {
  if (typeof window === "undefined" || !persistReady) return;
  const existing = tryParseSnapshotRaw(localStorage.getItem(PRODUCT_CARD_TEMPLATE_STORAGE_KEY));
  if (!existing) return;
  persistSnapshot({ ...existing, ui });
}

export function persistScreenState(
  state: ProductSheetState,
  ui: ProductSheetUiState,
  options?: { force?: boolean }
) {
  persistSnapshot(snapshotFromScreen(state, ui), options);
}

export function resetStoredProductSheetState(): ProductSheetState {
  const initial = createInitialState();
  markSheetStorageReady();
  clearLegacyStorage();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(MIGRATION_DISMISS_KEY);
  }
  persistSnapshot(snapshotFromScreen(initial, { ...DEFAULT_UI_STATE }), { force: true });
  return initial;
}

export function clearStoredProductSheetState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PRODUCT_CARD_TEMPLATE_STORAGE_KEY);
  clearLegacyStorage();
  clearSyncMeta();
  sessionStorage.removeItem(MIGRATION_DISMISS_KEY);
}

export function cloneStateBaselines(state: ProductSheetState) {
  return {
    global: { ...state.globalStyle },
    brands: cloneBrandStyles(state.brandStyles),
    cards: cloneCardStyles(state.cardStyles ?? {}),
  };
}
