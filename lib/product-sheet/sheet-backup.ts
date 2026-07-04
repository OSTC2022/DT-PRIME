import { saveAs } from "file-saver";
import {
  BACKUP_FILE_VERSION,
  PRODUCT_CARD_TEMPLATE_STORAGE_KEY,
} from "./storage-keys";
import {
  clearLegacyStorage,
  markSheetStorageReady,
  persistSnapshot,
  ProductSheetState,
} from "./sheet-storage";
import {
  logSnapshotVerification,
  parseSnapshotPayload,
  ProductCardTemplateSnapshot,
  ProductSheetUiState,
  snapshotFromScreen,
} from "./sheet-snapshot";

export type { ProductSheetUiState, ProductCardTemplateSnapshot } from "./sheet-snapshot";
export {
  DEFAULT_UI_STATE,
  loadProductSheetUiState,
  logSnapshotVerification,
  persistScreenState,
  saveProductSheetUiState,
} from "./sheet-storage";

export type ProductCardTemplateBackupFile = {
  version: number;
  exportedAt: string;
  source: string;
  storageKey: string;
  data: {
    cards: ProductCardTemplateSnapshot["cards"];
    products: ProductCardTemplateSnapshot["cards"];
    globalStyle: ProductCardTemplateSnapshot["globalStyle"];
    globalSettings: ProductCardTemplateSnapshot["globalStyle"];
    brandStyles: ProductCardTemplateSnapshot["brandStyles"];
    brandSettings: ProductCardTemplateSnapshot["brandStyles"];
    cardStyles: ProductCardTemplateSnapshot["cardStyles"];
    styles: ProductCardTemplateSnapshot["cardStyles"];
    presets: ProductCardTemplateSnapshot["presets"];
    ui: ProductCardTemplateSnapshot["ui"] & {
      selectedRange: ProductCardTemplateSnapshot["ui"]["selection"];
    };
  };
};

export type BuildBackupInput = {
  state: ProductSheetState;
  ui: ProductSheetUiState;
  source?: string;
};

export type ImportBackupErrorCode =
  | "parse"
  | "root-not-object"
  | "data-not-object"
  | "no-keys";

export class ImportBackupError extends Error {
  readonly code: ImportBackupErrorCode;

  constructor(code: ImportBackupErrorCode, message: string) {
    super(message);
    this.name = "ImportBackupError";
    this.code = code;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toBackupData(snapshot: ProductCardTemplateSnapshot): ProductCardTemplateBackupFile["data"] {
  return {
    cards: snapshot.cards,
    products: snapshot.cards,
    globalStyle: snapshot.globalStyle,
    globalSettings: snapshot.globalStyle,
    brandStyles: snapshot.brandStyles,
    brandSettings: snapshot.brandStyles,
    cardStyles: snapshot.cardStyles,
    styles: snapshot.cardStyles,
    presets: snapshot.presets,
    ui: {
      ...snapshot.ui,
      selectedRange: snapshot.ui.selection,
    },
  };
}

/** 현재 화면 state 기준 백업 파일 생성 (localStorage 덤프 아님) */
export function buildProductCardTemplateBackup(input: BuildBackupInput): ProductCardTemplateBackupFile {
  const snapshot = snapshotFromScreen(input.state, input.ui);

  return {
    version: BACKUP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    source: input.source ?? (typeof window !== "undefined" ? window.location.origin : "product-card-template"),
    storageKey: PRODUCT_CARD_TEMPLATE_STORAGE_KEY,
    data: toBackupData(snapshot),
  };
}

/** export 직전: 화면 state를 localStorage에 강제 저장 후 백업 파일 생성 */
export function exportProductCardTemplateBackup(input: BuildBackupInput): ProductCardTemplateBackupFile {
  const snapshot = snapshotFromScreen(input.state, input.ui);
  persistSnapshot(snapshot, { force: true });
  logSnapshotVerification("export", snapshot);
  return buildProductCardTemplateBackup(input);
}

export function downloadProductCardTemplateBackup(backup: ProductCardTemplateBackupFile) {
  const stamp = backup.exportedAt.slice(0, 19).replace(/[:T]/g, "-");
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  saveAs(blob, `product-card-template-v${backup.version}-${stamp}.json`);
}

export function importProductCardTemplateBackup(json: string): ProductCardTemplateSnapshot {
  if (typeof window === "undefined") {
    throw new ImportBackupError("no-keys", "브라우저에서만 가져올 수 있습니다.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json.trim().replace(/^\uFEFF/, ""));
  } catch {
    throw new ImportBackupError("parse", "JSON 파일 형식이 올바르지 않습니다.");
  }

  if (!isRecord(parsed)) {
    console.log("[product-card-template import] root is not object:", parsed);
    throw new ImportBackupError("root-not-object", "루트가 객체가 아닙니다.");
  }

  if ("data" in parsed && !isRecord(parsed.data)) {
    console.log("[product-card-template import] data is not object:", parsed.data);
    throw new ImportBackupError("data-not-object", "data 필드가 객체가 아님");
  }

  const snapshot = parseSnapshotPayload(parsed);
  if (!snapshot) {
    console.log("[product-card-template import] unrecognized structure:", parsed);
    throw new ImportBackupError("no-keys", "저장할 카드 데이터가 없음");
  }

  markSheetStorageReady();
  clearLegacyStorage();
  sessionStorage.removeItem("product-card-template-v4-migration-dismissed");
  persistSnapshot(snapshot, { force: true });
  logSnapshotVerification("import", snapshot);

  return snapshot;
}
