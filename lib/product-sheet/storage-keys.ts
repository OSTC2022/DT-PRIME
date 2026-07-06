/** product-card-template 페이지 localStorage — 단일 key로 통합 관리 */
export const PRODUCT_CARD_TEMPLATE_STORAGE_VERSION = 4;

export const PRODUCT_CARD_TEMPLATE_STORAGE_KEY = `product-card-template-v${PRODUCT_CARD_TEMPLATE_STORAGE_VERSION}`;

/** @deprecated PRODUCT_CARD_TEMPLATE_STORAGE_KEY 사용 */
export const STORAGE_KEY = PRODUCT_CARD_TEMPLATE_STORAGE_KEY;

/** v3 이하 및 구버전 — 자동 로드하지 않음 */
export const LEGACY_STORAGE_KEYS = [
  "product-card-template-v3",
  "product-card-template-v3-backup",
  "product-card-template-v3-ui",
  "product-card-template-v3-migration-dismissed",
  "product-card-template-v2",
  "product-card-template-v1",
  "product-sheet-state-v2",
  "product-sheet-state-v2-backup",
  "product-sheet-cards-v1",
] as const;

export const MIGRATION_DISMISS_KEY = "product-card-template-v4-migration-dismissed";

/** 마지막으로 클라우드와 맞춘 시각 (명시적 저장·가져오기 시 갱신) */
export const SYNC_META_KEY = "product-card-template-v4-sync-meta";

/** 「저장」 시 기록 — 「최신 기본값으로 초기화」가 이 스냅샷을 그대로 복원 */
export const BASELINE_STORAGE_KEY = `product-card-template-v${PRODUCT_CARD_TEMPLATE_STORAGE_VERSION}-baseline`;

/** public/product-card-template-default.json 시드 적용 버전 */
export const SHEET_SEED_VERSION = 3;
export const SHEET_SEED_VERSION_KEY = `product-card-template-v${PRODUCT_CARD_TEMPLATE_STORAGE_VERSION}-seed`;

/** @deprecated 단일 key로 통합됨 */
export const STORAGE_BACKUP_KEY = "product-card-template-v3-backup";

/** @deprecated 단일 key로 통합됨 */
export const UI_STORAGE_KEY = "product-card-template-v3-ui";

/** @deprecated PRODUCT_CARD_TEMPLATE_STORAGE_KEY 사용 */
export const PRODUCT_CARD_TEMPLATE_STORAGE_KEYS = {
  state: PRODUCT_CARD_TEMPLATE_STORAGE_KEY,
  stateBackup: STORAGE_BACKUP_KEY,
  ui: UI_STORAGE_KEY,
  migrationDismissed: MIGRATION_DISMISS_KEY,
} as const;

export const BACKUP_FILE_VERSION = PRODUCT_CARD_TEMPLATE_STORAGE_VERSION;

/** @deprecated */
export const ACTIVE_LOCAL_STORAGE_KEYS = [PRODUCT_CARD_TEMPLATE_STORAGE_KEY] as const;
