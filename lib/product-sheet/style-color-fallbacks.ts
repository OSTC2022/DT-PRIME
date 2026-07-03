import { getSheetColorTheme } from "./colors";
import { SheetStyleKey } from "./style-fields";
import { ProductSheetCardData } from "./types";
import { accentColorForCard } from "./title-parts";

export const AUTO_SHEET_COLOR_KEYS = new Set<SheetStyleKey>([
  "highlightColor",
  "priceColor",
  "accentColor",
  "lineAccentColor",
]);

export type SheetColorFallbacks = Partial<Record<SheetStyleKey, string>>;

export function getSheetStyleColorFallbacks(card: ProductSheetCardData): SheetColorFallbacks {
  const theme = getSheetColorTheme(card.color);
  return {
    highlightColor: accentColorForCard(card),
    priceColor: theme.price,
    accentColor: theme.topLine,
    lineAccentColor: theme.topLine,
  };
}

export function isAutoSheetColor(key: SheetStyleKey, value: string | undefined) {
  return AUTO_SHEET_COLOR_KEYS.has(key) && !value?.trim();
}

export function effectiveSheetColor(
  key: SheetStyleKey,
  value: string | undefined,
  fallbacks: SheetColorFallbacks
): string {
  const stored = value?.trim() ?? "";
  if (stored.startsWith("#")) return stored;
  if (AUTO_SHEET_COLOR_KEYS.has(key) && fallbacks[key]) return fallbacks[key]!;
  return stored || "#111827";
}
