import {
  EXCEL_ROW_HEIGHT,
  EXCEL_ROW_HEIGHT_LEGACY,
  SHEET_CARD_HEIGHT,
  SHEET_CARD_HEIGHT_DUAL,
  SHEET_CARD_WIDTH,
  SHEET_CELL_HEIGHT,
  SHEET_CELL_HEIGHT_LEGACY,
  SHEET_CELL_WIDTH,
} from "./types";

export type ProductSheetStyleConfig = {
  cellWidth: number;
  cellHeight: number;
  width: number;
  height: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  headerBackgroundColor: string;
  dividerColor: string;
  brandFontSize: number;
  brandColor: string;
  lineFontSize: number;
  lineColor: string;
  categoryColor: string;
  titleFontSize: number;
  titleColor: string;
  highlightFontSize: number;
  highlightColor: string;
  tagFontSize: number;
  tagColor: string;
  bottomFontSize: number;
  bottomColor: string;
  priceFontSize: number;
  priceColor: string;
  headerRowHeight: number;
  bodyPaddingX: number;
  bodyPaddingY: number;
  bodyPaddingTop: number;
  accentLineWidth: number;
  accentLinePercent: number;
  accentColor: string;
  accentLineOffsetX: number;
  lineAccentColor: string;
  lineAccentWidth: number;
  lineAccentPercent: number;
  lineAccentOffsetX: number;
  titleMarginBottom: number;
  dividerMarginBottom: number;
  /** 제품명·강조를 한 줄에 표시 */
  titleSingleLine: boolean;
  tagLineGap: number;
  tagPriceGap: number;
  pricePinBottom: number;
  /** @deprecated */
  topLineHeight: number;
  /** @deprecated */
  thickTopLineHeight: number;
};

/** 엑셀 열28·행110 기준 기본 스타일 */
export function createDefaultSheetStyle(): ProductSheetStyleConfig {
  return {
    cellWidth: SHEET_CELL_WIDTH,
    cellHeight: SHEET_CELL_HEIGHT,
    width: SHEET_CARD_WIDTH,
    height: SHEET_CARD_HEIGHT,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#d1d1d1",
    backgroundColor: "#ffffff",
    headerBackgroundColor: "#f6f7f9",
    dividerColor: "#9aa3af",
    brandFontSize: 15,
    brandColor: "#111827",
    lineFontSize: 15,
    lineColor: "#111827",
    categoryColor: "#9aa3af",
    titleFontSize: 15,
    titleColor: "#111827",
    highlightFontSize: 15,
    highlightColor: "",
    tagFontSize: 10,
    tagColor: "#111827",
    bottomFontSize: 8,
    bottomColor: "#1f2937",
    priceFontSize: 15,
    priceColor: "",
    headerRowHeight: 22,
    bodyPaddingX: 15,
    bodyPaddingY: 8,
    bodyPaddingTop: 2,
    accentLineWidth: 2,
    accentLinePercent: 50,
    accentColor: "",
    accentLineOffsetX: 0,
    lineAccentColor: "",
    lineAccentWidth: 0,
    lineAccentPercent: 0,
    lineAccentOffsetX: 0,
    titleMarginBottom: 0,
    dividerMarginBottom: 2,
    tagLineGap: 2,
    tagPriceGap: 2,
    pricePinBottom: 1,
    titleSingleLine: false,
    topLineHeight: 2,
    thickTopLineHeight: 3,
  };
}
export function mergeSheetStyle(
  base: ProductSheetStyleConfig,
  patch: Partial<ProductSheetStyleConfig>
): ProductSheetStyleConfig {
  return { ...base, ...patch };
}

export function migrateLegacySheetStyle(style: ProductSheetStyleConfig): ProductSheetStyleConfig {
  const defaults = createDefaultSheetStyle();
  const patch: Partial<ProductSheetStyleConfig> = {};

  if (style.width >= 250 || style.height >= 200) {
    const scale = Math.min(
      defaults.width / style.width,
      defaults.height / style.height
    );
    patch.width = defaults.width;
    patch.height = defaults.height;
    patch.cellWidth = defaults.cellWidth;
    patch.cellHeight = defaults.cellHeight;
    patch.brandFontSize = round(style.brandFontSize * scale, defaults.brandFontSize);
    patch.lineFontSize = round(style.lineFontSize * scale, defaults.lineFontSize);
    patch.titleFontSize = round(style.titleFontSize * scale, defaults.titleFontSize);
    patch.highlightFontSize = round(style.highlightFontSize * scale, defaults.highlightFontSize);
    patch.tagFontSize = round(style.tagFontSize * scale, defaults.tagFontSize);
    patch.bottomFontSize = round(style.bottomFontSize * scale, defaults.bottomFontSize);
    patch.priceFontSize = round(style.priceFontSize * scale, defaults.priceFontSize);
    patch.headerRowHeight = round(style.headerRowHeight * scale, defaults.headerRowHeight);
    patch.bodyPaddingX = round(style.bodyPaddingX * scale, defaults.bodyPaddingX);
    patch.bodyPaddingY = round(style.bodyPaddingY * scale, defaults.bodyPaddingY);
    patch.bodyPaddingTop = round(
      (style.bodyPaddingTop ?? style.bodyPaddingY) * scale,
      defaults.bodyPaddingTop
    );
    patch.accentLineWidth = round(style.accentLineWidth * scale, defaults.accentLineWidth);
    patch.borderRadius = round(style.borderRadius * scale, defaults.borderRadius);
    patch.borderWidth = round(style.borderWidth * scale, defaults.borderWidth);
  }

  if (!("headerBackgroundColor" in style)) {
    patch.headerBackgroundColor = defaults.headerBackgroundColor;
  }
  if (!("bodyPaddingX" in style)) {
    patch.bodyPaddingX = defaults.bodyPaddingX;
    patch.bodyPaddingY = defaults.bodyPaddingY;
  }
  if (!("accentLineWidth" in style)) {
    patch.accentLineWidth = defaults.accentLineWidth;
    patch.accentLinePercent = defaults.accentLinePercent;
  }
  if (!("categoryColor" in style)) {
    patch.categoryColor = defaults.categoryColor;
  }
  if (!("highlightFontSize" in style) || style.highlightFontSize < 8) {
    patch.highlightFontSize = defaults.highlightFontSize;
  }
  if (!("tagPriceGap" in style)) {
    patch.titleMarginBottom = defaults.titleMarginBottom;
    patch.dividerMarginBottom = defaults.dividerMarginBottom;
    patch.tagLineGap = defaults.tagLineGap;
    patch.tagPriceGap = defaults.tagPriceGap;
  }
  if (!("pricePinBottom" in style)) {
    patch.pricePinBottom = defaults.pricePinBottom;
  }
  if (!("bodyPaddingTop" in style)) {
    patch.bodyPaddingTop = defaults.bodyPaddingTop;
  }
  if (!("borderWidth" in style)) {
    patch.borderWidth = defaults.borderWidth;
  }
  if (!("highlightColor" in style)) {
    patch.highlightColor = defaults.highlightColor;
  }
  if (!("priceColor" in style)) {
    patch.priceColor = defaults.priceColor;
  }
  if (!("accentColor" in style)) {
    patch.accentColor = defaults.accentColor;
  }
  if (!("accentLineOffsetX" in style)) {
    patch.accentLineOffsetX = defaults.accentLineOffsetX;
    patch.lineAccentColor = defaults.lineAccentColor;
    patch.lineAccentWidth = defaults.lineAccentWidth;
    patch.lineAccentPercent = defaults.lineAccentPercent;
    patch.lineAccentOffsetX = defaults.lineAccentOffsetX;
  }
  if (!("titleSingleLine" in style)) {
    patch.titleSingleLine = defaults.titleSingleLine;
  }
  if (!style.accentLineWidth || style.accentLineWidth < 1) {
    patch.accentLineWidth = defaults.accentLineWidth;
  }
  if (!style.accentLinePercent || style.accentLinePercent < 4) {
    patch.accentLinePercent = defaults.accentLinePercent;
  }

  if (style.borderWidth === 6 && style.borderColor === "#f6f7f9") {
    patch.borderWidth = defaults.borderWidth;
    patch.borderColor = defaults.borderColor;
  } else if (style.borderWidth === 6 && !("borderColor" in style)) {
    patch.borderWidth = defaults.borderWidth;
    patch.borderColor = defaults.borderColor;
  }

  const excelRowRatio = EXCEL_ROW_HEIGHT / EXCEL_ROW_HEIGHT_LEGACY;
  if (style.cellHeight === SHEET_CELL_HEIGHT_LEGACY) {
    patch.cellHeight = defaults.cellHeight;
    const scaleCard = (h: number) => Math.round(h * excelRowRatio);
    if (style.height === 142) patch.height = SHEET_CARD_HEIGHT;
    else if (style.height === 188) patch.height = SHEET_CARD_HEIGHT_DUAL;
    else if ([160, 170].includes(style.height)) patch.height = scaleCard(style.height);
  }

  return Object.keys(patch).length > 0 ? mergeSheetStyle(style, patch) : style;
}

function round(n: number, fallback: number): number {
  return Math.max(1, Math.round(n * 10) / 10) || fallback;
}
