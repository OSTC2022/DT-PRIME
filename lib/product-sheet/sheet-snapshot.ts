import { SheetSelection } from "./selection";
import { ProductSheetStyleConfig } from "./styles";
import { ProductSheetPreset } from "./presets";
import { ProductSheetCardData } from "./types";
import { ProductSheetState } from "./sheet-storage";

export type ProductSheetUiState = {
  filters: { query: string; brand: string; color: string };
  selection: SheetSelection;
  exportScope: "all" | "selected";
  multiSelectMode: boolean;
};

/** localStorage·백업 파일에 저장하는 전체 스냅샷 */
export type ProductCardTemplateSnapshot = {
  cards: ProductSheetCardData[];
  globalStyle: ProductSheetStyleConfig;
  brandStyles: Record<string, ProductSheetStyleConfig>;
  cardStyles: Record<string, ProductSheetStyleConfig>;
  presets: ProductSheetPreset[];
  ui: ProductSheetUiState;
};

export const DEFAULT_UI_STATE: ProductSheetUiState = {
  filters: { query: "", brand: "", color: "" },
  selection: [],
  exportScope: "all",
  multiSelectMode: false,
};

export function snapshotFromScreen(
  state: ProductSheetState,
  ui: ProductSheetUiState
): ProductCardTemplateSnapshot {
  return {
    cards: state.cards.map((c) => ({ ...c, tags: c.tags ? [...c.tags] : undefined })),
    globalStyle: { ...state.globalStyle },
    brandStyles: JSON.parse(JSON.stringify(state.brandStyles ?? {})),
    cardStyles: JSON.parse(JSON.stringify(state.cardStyles ?? {})),
    presets: state.presets.map((p) => ({
      ...p,
      style: { ...p.style },
    })),
    ui: {
      filters: { ...ui.filters },
      selection: [...ui.selection],
      exportScope: ui.exportScope,
      multiSelectMode: ui.multiSelectMode,
    },
  };
}

export function stateFromSnapshot(snapshot: ProductCardTemplateSnapshot): ProductSheetState {
  return {
    cards: snapshot.cards,
    globalStyle: snapshot.globalStyle,
    brandStyles: snapshot.brandStyles,
    cardStyles: snapshot.cardStyles,
    presets: snapshot.presets,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeBrandTypo(card: ProductSheetCardData): ProductSheetCardData {
  if (card.brand?.startsWith("멜라논사")) {
    return { ...card, brand: card.brand.replace("멜라논사", "멜라노사") };
  }
  return card;
}

function parseUi(raw: unknown): ProductSheetUiState {
  if (!isRecord(raw)) return { ...DEFAULT_UI_STATE };
  return {
    filters: {
      query: typeof raw.filters === "object" && raw.filters && "query" in raw.filters
        ? String((raw.filters as { query?: string }).query ?? "")
        : "",
      brand: typeof raw.filters === "object" && raw.filters && "brand" in raw.filters
        ? String((raw.filters as { brand?: string }).brand ?? "")
        : "",
      color: typeof raw.filters === "object" && raw.filters && "color" in raw.filters
        ? String((raw.filters as { color?: string }).color ?? "")
        : "",
    },
    selection: Array.isArray(raw.selection)
      ? raw.selection.map(String)
      : Array.isArray(raw.selectedRange)
        ? raw.selectedRange.map(String)
        : [],
    exportScope:
      raw.exportScope === "selected" || raw.selectedRange === "selected" ? "selected" : "all",
    multiSelectMode: Boolean(raw.multiSelectMode),
  };
}

/** 백업/가져오기 — 화면 그대로 복원 (normalizeCardStyles 등 재계산 없음) */
export function parseSnapshotPayload(raw: unknown): ProductCardTemplateSnapshot | null {
  if (!isRecord(raw)) return null;

  let body = raw;
  if (isRecord(raw.data)) {
    body = raw.data;
  }

  const cardsRaw = body.cards ?? body.products;
  if (Array.isArray(cardsRaw) && cardsRaw.length > 0) {
    return buildSnapshotFromBody(body, cardsRaw as ProductSheetCardData[]);
  }

  // v3 flat localStorage 덤프: { "product-card-template-v3": "{...}" }
  for (const [key, value] of Object.entries(body)) {
    if (!key.includes("product-card-template") || key.endsWith("-ui")) continue;
    try {
      const inner = typeof value === "string" ? JSON.parse(value) : value;
      if (isRecord(inner) && Array.isArray(inner.cards)) {
        let ui = parseUi(body.ui);
        const uiEntry = body[`${key}-ui`] ?? body["product-card-template-v3-ui"];
        if (uiEntry) {
          ui = parseUi(typeof uiEntry === "string" ? JSON.parse(uiEntry) : uiEntry);
        }
        return buildSnapshotFromBody({ ...inner, ui }, inner.cards as ProductSheetCardData[]);
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildSnapshotFromBody(
  body: Record<string, unknown>,
  cards: ProductSheetCardData[]
): ProductCardTemplateSnapshot {
  const globalStyle = (body.globalStyle ?? body.globalSettings ?? {}) as ProductSheetStyleConfig;
  const brandStyles = (body.brandStyles ?? body.brandSettings ?? {}) as Record<
    string,
    ProductSheetStyleConfig
  >;
  const cardStyles = (body.cardStyles ?? body.styles ?? {}) as Record<string, ProductSheetStyleConfig>;
  const presets = Array.isArray(body.presets) ? (body.presets as ProductSheetPreset[]) : [];

  return {
    cards: cards.map((c) => normalizeBrandTypo(c)),
    globalStyle: { ...globalStyle },
    brandStyles: JSON.parse(JSON.stringify(brandStyles)),
    cardStyles: JSON.parse(JSON.stringify(cardStyles)),
    presets: presets.map((p) => ({ ...p, style: { ...p.style } })),
    ui: parseUi(body.ui ?? body),
  };
}

export function logSnapshotVerification(label: string, snapshot: ProductCardTemplateSnapshot) {
  const cards = snapshot.cards;
  console.log(`[product-card-template ${label}] verification`, {
    cardCount: cards.length,
    brands: Array.from(new Set(cards.map((c) => c.brand).filter(Boolean))),
    samples: cards.slice(0, 5).map((c) => ({
      id: c.id,
      brand: c.brand,
      title: c.title,
      highlight: c.highlight,
      price: c.price,
      color: c.color,
    })),
    globalSettings: snapshot.globalStyle,
    brandSettings: snapshot.brandStyles,
    styles: snapshot.cardStyles,
    presets: snapshot.presets.length,
    selectedRange: snapshot.ui.selection,
    exportScope: snapshot.ui.exportScope,
    filters: snapshot.ui.filters,
  });
}
