import { SHEET_STYLE_GROUPS, SheetStyleKey } from "./style-fields";
import { AccentTarget } from "./accent-line-style";
import { SpacingFieldKey } from "./spacing-fields";

export type PreviewRegionId = "header" | "title" | "divider" | "tags" | "price";

export type PreviewFocus =
  | { type: "region"; region: PreviewRegionId }
  | { type: "spacing"; key: SpacingFieldKey }
  | { type: "accent"; target: AccentTarget };

export const ACCENT_FOCUS_META: Record<
  AccentTarget,
  { label: string; section: string; fieldKeys: SheetStyleKey[] }
> = {
  brand: {
    label: "브랜드 포인트",
    section: "카드 크기 · 레이아웃",
    fieldKeys: ["accentColor", "accentLineWidth", "accentLinePercent", "accentLineOffsetX"],
  },
  line: {
    label: "구분 포인트 (바이오)",
    section: "카드 크기 · 레이아웃",
    fieldKeys: ["lineAccentColor", "lineAccentWidth", "lineAccentPercent", "lineAccentOffsetX"],
  },
};

export const PREVIEW_REGION_META: Record<
  PreviewRegionId,
  { label: string; section: string; fieldKeys: SheetStyleKey[] }
> = {
  header: {
    label: "브랜드 · 구분",
    section: "글씨 — 브랜드 · 구분",
    fieldKeys: [
      "brandFontSize",
      "brandColor",
      "lineFontSize",
      "categoryColor",
      "headerRowHeight",
      "headerBackgroundColor",
    ],
  },
  title: {
    label: "제품명 · 강조",
    section: "글씨 — 제품명 · 강조",
    fieldKeys: [
      "titleFontSize",
      "titleColor",
      "highlightFontSize",
      "highlightColor",
      "bodyPaddingTop",
      "titleMarginBottom",
    ],
  },
  divider: {
    label: "구분선",
    section: "카드 크기 · 레이아웃",
    fieldKeys: ["titleMarginBottom", "dividerMarginBottom", "dividerColor"],
  },
  tags: {
    label: "해시태그",
    section: "글씨 — 해시태그 · 가격",
    fieldKeys: ["tagFontSize", "tagColor", "tagLineGap", "dividerColor"],
  },
  price: {
    label: "가격 · 용량",
    section: "글씨 — 해시태그 · 가격",
    fieldKeys: ["priceFontSize", "priceColor", "bottomFontSize", "bottomColor", "tagPriceGap", "pricePinBottom"],
  },
};

const SPACING_SECTION = "카드 크기 · 레이아웃";

export function sectionForFocus(focus: PreviewFocus | null): string | null {
  if (!focus) return null;
  if (focus.type === "region") return PREVIEW_REGION_META[focus.region].section;
  if (focus.type === "accent") return ACCENT_FOCUS_META[focus.target].section;
  return SPACING_SECTION;
}

export function labelForFocus(focus: PreviewFocus | null): string {
  if (!focus) return "";
  if (focus.type === "region") return PREVIEW_REGION_META[focus.region].label;
  if (focus.type === "accent") return ACCENT_FOCUS_META[focus.target].label;
  const field = SHEET_STYLE_GROUPS.flatMap((g) => g.fields).find((f) => f.key === focus.key);
  return field?.label ?? focus.key;
}

export function fieldKeysForFocus(focus: PreviewFocus | null): SheetStyleKey[] {
  if (!focus) return [];
  if (focus.type === "region") return PREVIEW_REGION_META[focus.region].fieldKeys;
  if (focus.type === "accent") return ACCENT_FOCUS_META[focus.target].fieldKeys;
  return [focus.key];
}

export function fieldDefForKey(key: SheetStyleKey) {
  for (const group of SHEET_STYLE_GROUPS) {
    const field = group.fields.find((f) => f.key === key);
    if (field) return field;
  }
  return null;
}
