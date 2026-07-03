import { ProductSheetStyleConfig } from "./styles";



export type SheetStyleKey = keyof ProductSheetStyleConfig;



export const SHEET_STYLE_GROUPS: {

  title: string;

  fields: { key: SheetStyleKey; label: string; type: "number" | "color" }[];

}[] = [

  {

    title: "카드 크기 · 레이아웃",

    fields: [

      { key: "cellWidth", label: "엑셀 셀 너비 (px)", type: "number" },

      { key: "cellHeight", label: "엑셀 셀 높이 (px)", type: "number" },

      { key: "width", label: "카드 너비 (px)", type: "number" },

      { key: "height", label: "카드 높이 (px)", type: "number" },

      { key: "borderRadius", label: "모서리 둥글기", type: "number" },

      { key: "borderWidth", label: "테두리 두께", type: "number" },

      { key: "borderColor", label: "테두리 색", type: "color" },

      { key: "backgroundColor", label: "카드 배경", type: "color" },

      { key: "headerBackgroundColor", label: "헤더 배경", type: "color" },

      { key: "headerRowHeight", label: "헤더 높이 (px)", type: "number" },

      { key: "bodyPaddingX", label: "본문 가로 여백", type: "number" },

      { key: "bodyPaddingTop", label: "강조선~제품명 여백", type: "number" },

      { key: "bodyPaddingY", label: "본문 하단 여백", type: "number" },

      { key: "accentLineWidth", label: "브랜드 포인트 두께", type: "number" },

      { key: "accentLinePercent", label: "브랜드 포인트 너비 (%)", type: "number" },

      { key: "accentColor", label: "브랜드 포인트 색", type: "color" },

      { key: "accentLineOffsetX", label: "브랜드 포인트 좌우 (0=왼쪽 끝)", type: "number" },

      { key: "lineAccentWidth", label: "구분 포인트 두께 (0=동일)", type: "number" },

      { key: "lineAccentPercent", label: "구분 포인트 너비 (%)", type: "number" },

      { key: "lineAccentColor", label: "구분 포인트 색", type: "color" },

      { key: "lineAccentOffsetX", label: "구분 포인트 좌우 (0=오른쪽 끝)", type: "number" },

      { key: "dividerColor", label: "구분선 색", type: "color" },

      { key: "titleMarginBottom", label: "제품명 아래 여백", type: "number" },

      { key: "dividerMarginBottom", label: "구분선 아래 여백", type: "number" },

      { key: "tagLineGap", label: "해시태그 줄 간격", type: "number" },

      { key: "tagPriceGap", label: "해시태그~가격 간격", type: "number" },

      { key: "pricePinBottom", label: "가격 하단 고정 (0=끔, 숫자=하단 여백px)", type: "number" },

    ],

  },

  {

    title: "글씨 — 브랜드 · 구분",

    fields: [

      { key: "brandFontSize", label: "브랜드 크기", type: "number" },

      { key: "brandColor", label: "브랜드 색", type: "color" },

      { key: "lineFontSize", label: "구분 크기", type: "number" },

      { key: "categoryColor", label: "구분 색", type: "color" },

    ],

  },

  {

    title: "글씨 — 제품명 · 강조",

    fields: [

      { key: "titleFontSize", label: "제품명 크기", type: "number" },

      { key: "titleColor", label: "제품명 색", type: "color" },

      { key: "highlightFontSize", label: "강조 크기", type: "number" },

      { key: "highlightColor", label: "강조 색", type: "color" },

    ],

  },

  {

    title: "글씨 — 해시태그 · 가격",

    fields: [

      { key: "tagFontSize", label: "해시태그 크기", type: "number" },

      { key: "tagColor", label: "해시태그 색", type: "color" },

      { key: "bottomFontSize", label: "용량 크기", type: "number" },

      { key: "bottomColor", label: "용량 색", type: "color" },

      { key: "priceFontSize", label: "가격 크기", type: "number" },

      { key: "priceColor", label: "가격 색", type: "color" },

    ],

  },

];



export const SHEET_COLLAPSIBLE_SECTIONS = SHEET_STYLE_GROUPS.map((g) => ({

  id: g.title,

  title: g.title,

}));

