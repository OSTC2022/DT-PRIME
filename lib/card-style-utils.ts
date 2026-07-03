import { CardStyleConfig } from "./template-styles";
import { ProductItem } from "./types";

export function resolveCardStyle(style: CardStyleConfig | undefined, item: ProductItem) {
  const accent = style?.accentColor ?? item.cardColor ?? "hsl(var(--brand-red))";
  const px = (n: number | undefined, fallback: number) => (n ? `${n}px` : undefined);

  return {
    accent,
    box: style
      ? {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          borderWidth: style.borderWidth,
          borderRadius: style.borderRadius,
          borderStyle: "solid" as const,
          width: "100%",
          height: "100%",
        }
      : undefined,
    brand: {
      fontSize: px(style?.brandFontSize, 14),
      color: style?.brandColor ?? "#171717",
      fontWeight: 900,
    },
    category: {
      fontSize: px(style?.categoryFontSize, 11),
      color: style?.categoryColor ?? accent,
      fontWeight: 700,
    },
    title: {
      fontSize: px(style?.titleFontSize, 20),
      color: style?.titleColor ?? "#171717",
      fontWeight: 900,
    },
    highlight: { color: style?.highlightColor ?? accent },
    subtitle: {
      fontSize: px(style?.subtitleFontSize, 12),
      color: style?.subtitleColor ?? "#4b5563",
      fontWeight: 700,
    },
    tags: {
      fontSize: px(style?.tagFontSize, 14),
      color: style?.tagColor ?? "#171717",
      fontWeight: 700,
    },
    price: {
      fontSize: px(style?.priceFontSize, 24),
      color: style?.priceColor ?? accent,
      fontWeight: 900,
    },
    priceSuffix: {
      fontSize: px(style?.priceFontSize ? style.priceFontSize - 4 : 16, 16),
      color: style?.priceSuffixColor ?? "#171717",
      fontWeight: 700,
    },
    volume: {
      fontSize: px(style?.volumeFontSize, 12),
      color: style?.volumeColor ?? "#374151",
      fontWeight: 700,
    },
    tabInactive: {
      fontSize: px(style?.tabInactiveFontSize, 14),
      color: style?.tabInactiveColor ?? "#9ca3af",
      fontWeight: 700,
    },
    bodyBg: style?.bodyBackgroundColor ?? "#ffffff",
    tabBg: style?.tabBackgroundColor ?? "#f5f5f5",
    divider: style?.dividerColor ?? "#d1d5db",
  };
}
