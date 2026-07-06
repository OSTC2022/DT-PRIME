import { ProductSheetStyleConfig } from "./styles";
import { SHEET_CARD_HEIGHT, SHEET_CARD_WIDTH } from "./types";

type ScaledNumericKey =
  | "brandFontSize"
  | "lineFontSize"
  | "titleFontSize"
  | "highlightFontSize"
  | "tagFontSize"
  | "bottomFontSize"
  | "priceFontSize"
  | "headerRowHeight"
  | "bodyPaddingX"
  | "bodyPaddingY"
  | "bodyPaddingTop"
  | "accentLineWidth"
  | "borderRadius"
  | "borderWidth"
  | "titleMarginBottom"
  | "dividerMarginBottom"
  | "tagLineGap"
  | "tagPriceGap";

const SCALED_NUMERIC_KEYS: ScaledNumericKey[] = [
  "brandFontSize",
  "lineFontSize",
  "titleFontSize",
  "highlightFontSize",
  "tagFontSize",
  "bottomFontSize",
  "priceFontSize",
  "headerRowHeight",
  "bodyPaddingX",
  "bodyPaddingY",
  "bodyPaddingTop",
  "accentLineWidth",
  "borderRadius",
  "borderWidth",
  "titleMarginBottom",
  "dividerMarginBottom",
  "tagLineGap",
  "tagPriceGap",
];

function roundPx(n: number, min = 1): number {
  return Math.max(min, Math.round(n * 10) / 10);
}

const ZERO_MIN_KEYS = new Set<ScaledNumericKey>([
  "bodyPaddingTop",
  "bodyPaddingY",
  "bodyPaddingX",
  "titleMarginBottom",
  "dividerMarginBottom",
  "tagLineGap",
  "tagPriceGap",
  "borderWidth",
]);

function minForKey(key: ScaledNumericKey): number {
  return ZERO_MIN_KEYS.has(key) ? 0 : 1;
}

function scaleNumericFields(
  style: ProductSheetStyleConfig,
  scale: number
): ProductSheetStyleConfig {
  const next = { ...style };
  for (const key of SCALED_NUMERIC_KEYS) {
    next[key] = roundPx(style[key] * scale, minForKey(key));
  }
  return next;
}

/** 카드 실제 크기 대비 기준(188×142) 비율 */
export function getCardScale(width: number, height: number): number {
  return Math.min(width / SHEET_CARD_WIDTH, height / SHEET_CARD_HEIGHT);
}

/** 렌더 시 카드 크기에 맞게 글씨·여백을 비율 축소 */
export function resolveScaledStyle(style: ProductSheetStyleConfig): ProductSheetStyleConfig {
  const scale = getCardScale(style.width, style.height);
  if (scale >= 0.998 && scale <= 1.002) return style;
  return scaleNumericFields(style, scale);
}

/** 모서리 드래그·크기 입력 — 카드 크기만 변경 (글씨 크기는 유지) */
export function applySheetDimensions(
  style: ProductSheetStyleConfig,
  width: number,
  height: number
): ProductSheetStyleConfig {
  return {
    ...style,
    width: Math.round(Math.max(100, width)),
    height: Math.round(Math.max(90, height)),
  };
}
