export type SheetColorKey =

  | "repair"

  | "k"

  | "cica"

  | "hyaluron"

  | "sun"

  | "retinol"

  | "black"

  | "purple"

  | "egf"

  | "red"

  | "blueDark"

  | "hanmi"

  | "ckdPink"

  | "ckdGreen";



export type ProductSheetCardData = {

  id: string;

  brand: string;

  line?: string;

  title: string;

  highlight?: string;

  tags?: string[];

  bottom?: string;

  price?: string;

  color?: SheetColorKey;

};



export type ProductSheetCardInput = Omit<ProductSheetCardData, "id">;



/** 웹·엑셀 그리드: 한 줄 3열 */

export const SHEET_COLUMNS = 3;



/** 엑셀 기준: 열 너비 28, 행 높이 110 */

export const EXCEL_COL_WIDTH = 28;

export const EXCEL_ROW_HEIGHT = 110;

/** 이전 기본 행 높이 (마이그레이션용) */
export const EXCEL_ROW_HEIGHT_LEGACY = 125.25;

/** 엑셀 셀 크기 (px 환산) */

export const SHEET_CELL_WIDTH = Math.round(EXCEL_COL_WIDTH * 7 + 5);

export const SHEET_CELL_HEIGHT = Math.round((EXCEL_ROW_HEIGHT * 96) / 72);

export const SHEET_CELL_HEIGHT_LEGACY = Math.round((EXCEL_ROW_HEIGHT_LEGACY * 96) / 72);

/** 셀 안 제품 카드 크기 */

export const SHEET_CARD_WIDTH = 215;

export const SHEET_CARD_HEIGHT = 160;

/** 가격 2줄(//) 카드 기본 높이 */
export const SHEET_CARD_HEIGHT_DUAL = Math.round(188 * (EXCEL_ROW_HEIGHT / EXCEL_ROW_HEIGHT_LEGACY));

