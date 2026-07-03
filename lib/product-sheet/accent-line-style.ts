import { ProductSheetStyleConfig } from "./styles";

export type AccentOffsetKey = "accentLineOffsetX" | "lineAccentOffsetX";
export type AccentTarget = "brand" | "line";

export function resolveLineAccentWidth(s?: ProductSheetStyleConfig): number {
  const custom = s?.lineAccentWidth ?? 0;
  if (custom > 0) return custom;
  return s?.accentLineWidth ?? 2;
}

export function resolveLineAccentPercent(s?: ProductSheetStyleConfig): number {
  const custom = s?.lineAccentPercent ?? 0;
  if (custom > 0) return custom;
  return s?.accentLinePercent ?? 50;
}

export function resolveLineAccentColor(
  s: ProductSheetStyleConfig | undefined,
  brandAccentColor: string
): string {
  return s?.lineAccentColor?.trim() || brandAccentColor;
}
