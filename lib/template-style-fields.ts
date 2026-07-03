import { CardStyleConfig } from "./template-styles";

export type StyleKey = keyof CardStyleConfig;

export const STYLE_GROUPS: {
  title: string;
  fields: { key: StyleKey; label: string; type: "number" | "color" }[];
}[] = [
  {
    title: "카드 크기 · 테두리",
    fields: [
      { key: "width", label: "너비 (px)", type: "number" },
      { key: "height", label: "높이 (px)", type: "number" },
      { key: "borderWidth", label: "테두리 두께", type: "number" },
      { key: "borderRadius", label: "모서리 둥글기", type: "number" },
      { key: "backgroundColor", label: "카드 배경", type: "color" },
      { key: "bodyBackgroundColor", label: "본문 배경", type: "color" },
      { key: "tabBackgroundColor", label: "탭 배경", type: "color" },
      { key: "borderColor", label: "테두리 색", type: "color" },
      { key: "dividerColor", label: "구분선 색", type: "color" },
      { key: "accentColor", label: "포인트 색", type: "color" },
      { key: "tabBarHeight", label: "탭 영역 높이 (px)", type: "number" },
      { key: "activeTabBorderWidth", label: "활성 탭 밑줄", type: "number" },
    ],
  },
  {
    title: "글씨 — 브랜드 · 카테고리",
    fields: [
      { key: "brandFontSize", label: "브랜드 크기", type: "number" },
      { key: "brandColor", label: "브랜드 색", type: "color" },
      { key: "categoryFontSize", label: "카테고리 크기", type: "number" },
      { key: "categoryColor", label: "카테고리 색", type: "color" },
      { key: "tabInactiveFontSize", label: "비활성 탭 크기", type: "number" },
      { key: "tabInactiveColor", label: "비활성 탭 색", type: "color" },
    ],
  },
  {
    title: "글씨 — 상품명 · 해시태그",
    fields: [
      { key: "titleFontSize", label: "상품명 크기", type: "number" },
      { key: "titleColor", label: "상품명 색", type: "color" },
      { key: "highlightColor", label: "강조 단어 색", type: "color" },
      { key: "subtitleFontSize", label: "부제목 크기", type: "number" },
      { key: "subtitleColor", label: "부제목 색", type: "color" },
      { key: "tagFontSize", label: "해시태그 크기", type: "number" },
      { key: "tagColor", label: "해시태그 색", type: "color" },
    ],
  },
  {
    title: "글씨 — 가격 · 용량",
    fields: [
      { key: "priceFontSize", label: "가격 크기", type: "number" },
      { key: "priceColor", label: "가격 색", type: "color" },
      { key: "priceSuffixColor", label: "「원」 색", type: "color" },
      { key: "volumeFontSize", label: "용량 크기", type: "number" },
      { key: "volumeColor", label: "용량 색", type: "color" },
    ],
  },
];

export const BULK_STYLE_KEYS: StyleKey[] = [
  ...STYLE_GROUPS.flatMap((g) => g.fields.map((f) => f.key)),
  "brandOffsetX",
  "categoryOffsetX",
];

export const BULK_COLLAPSIBLE_SECTIONS = STYLE_GROUPS.map((g) => ({
  id: g.title,
  title: g.title,
}));

export function pickBulkStyle(patch: Partial<CardStyleConfig>): Partial<CardStyleConfig> {
  const allowed = new Set(BULK_STYLE_KEYS);
  return Object.fromEntries(
    Object.entries(patch).filter(([k]) => allowed.has(k as StyleKey))
  ) as Partial<CardStyleConfig>;
}

export const COLLAPSIBLE_SECTIONS = [
  { id: "extra-demo", title: "기타 미리보기 문구" },
  ...STYLE_GROUPS.map((g) => ({ id: g.title, title: g.title })),
];
