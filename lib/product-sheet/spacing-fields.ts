import { ProductSheetStyleConfig } from "./styles";

export type SpacingFieldKey =
  | "bodyPaddingTop"
  | "titleMarginBottom"
  | "dividerMarginBottom"
  | "tagPriceGap";

export type SpacingFieldMeta = {
  key: SpacingFieldKey;
  label: string;
  between: string;
  min: number;
  max: number;
};

export const SHEET_SPACING_FIELDS: SpacingFieldMeta[] = [
  {
    key: "bodyPaddingTop",
    label: "본문 상단",
    between: "강조선 ↔ 제품명",
    min: 0,
    max: 48,
  },
  {
    key: "titleMarginBottom",
    label: "제품명 아래",
    between: "제품명 ↔ 구분선",
    min: 0,
    max: 48,
  },
  {
    key: "dividerMarginBottom",
    label: "구분선 아래",
    between: "구분선 ↔ 해시태그",
    min: 0,
    max: 48,
  },
  {
    key: "tagPriceGap",
    label: "해시태그 아래",
    between: "해시태그 ↔ 가격",
    min: 0,
    max: 48,
  },
];

export function getSpacingFieldMeta(key: SpacingFieldKey): SpacingFieldMeta {
  return SHEET_SPACING_FIELDS.find((f) => f.key === key)!;
}

export function spacingValue(style: ProductSheetStyleConfig, key: SpacingFieldKey): number {
  const defaults: Record<SpacingFieldKey, number> = {
    bodyPaddingTop: 2,
    titleMarginBottom: 2,
    dividerMarginBottom: 4,
    tagPriceGap: 2,
  };
  const v = style[key];
  return typeof v === "number" ? v : defaults[key];
}
