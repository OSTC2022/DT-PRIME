import { ProductItem, ProductTemplate } from "./types";

/** 템플릿별 카드 스타일 (크기·색상·글씨) */
export interface CardStyleConfig {
  width: number;
  height: number;
  backgroundColor: string;
  bodyBackgroundColor: string;
  tabBackgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  accentColor: string;
  brandFontSize: number;
  brandColor: string;
  categoryFontSize: number;
  categoryColor: string;
  titleFontSize: number;
  titleColor: string;
  highlightColor: string;
  subtitleFontSize: number;
  subtitleColor: string;
  tagFontSize: number;
  tagColor: string;
  priceFontSize: number;
  priceColor: string;
  priceSuffixColor: string;
  volumeFontSize: number;
  volumeColor: string;
  tabInactiveFontSize: number;
  tabInactiveColor: string;
  dividerColor: string;
  /** 브랜드 텍스트 가로 위치 (0~100%, 50=가운데) */
  brandOffsetX: number;
  /** 카테고리·탭2 텍스트 가로 위치 (0~100%) */
  categoryOffsetX: number;
  /** 실무용 카드 상단 탭 영역 높이 (px) */
  tabBarHeight: number;
  /** 실무용 카드 활성 탭 밑줄 두께 (px) */
  activeTabBorderWidth: number;
}

export interface TemplatePreset {
  id: string;
  name: string;
  /** 저장 시 지정하는 분류 폴더 */
  category: string;
  templateType: ProductTemplate;
  style: CardStyleConfig;
  demo?: Partial<ProductItem>;
  savedAt: string;
}

const BASE: Omit<CardStyleConfig, "width" | "height" | "accentColor" | "backgroundColor" | "borderColor" | "borderRadius"> = {
  bodyBackgroundColor: "#ffffff",
  tabBackgroundColor: "#f5f5f5",
  borderWidth: 1,
  brandFontSize: 14,
  brandColor: "#171717",
  categoryFontSize: 11,
  categoryColor: "#dc2626",
  titleFontSize: 20,
  titleColor: "#171717",
  highlightColor: "#b8d62e",
  subtitleFontSize: 12,
  subtitleColor: "#4b5563",
  tagFontSize: 14,
  tagColor: "#171717",
  priceFontSize: 24,
  priceColor: "#dc2626",
  priceSuffixColor: "#171717",
  volumeFontSize: 12,
  volumeColor: "#374151",
  tabInactiveFontSize: 14,
  tabInactiveColor: "#9ca3af",
  dividerColor: "#d1d5db",
  brandOffsetX: 50,
  categoryOffsetX: 50,
  tabBarHeight: 28,
  activeTabBorderWidth: 2,
};

const SIZES: Record<ProductTemplate, { width: number; height: number }> = {
  basic: { width: 220, height: 165 },
  premium: { width: 220, height: 165 },
  rounded: { width: 220, height: 165 },
  line: { width: 220, height: 165 },
  dark: { width: 220, height: 165 },
  event: { width: 220, height: 165 },
  set: { width: 220, height: 165 },
  practical: { width: 240, height: 300 },
};

const ACCENTS: Partial<Record<ProductTemplate, string>> = {
  basic: "#dc2626",
  practical: "#b8d62e",
  line: "hsl(215, 80%, 50%)",
  set: "#1f7a4d",
  dark: "#dc2626",
};

export function createDefaultStyle(template: ProductTemplate): CardStyleConfig {
  const { width, height } = SIZES[template];
  const accent = ACCENTS[template] ?? "#dc2626";
  const isDark = template === "dark";
  const isPractical = template === "practical";

  return {
    ...BASE,
    width,
    height,
    accentColor: accent,
    backgroundColor: isDark ? "#111111" : isPractical ? "#f5f5f5" : "#ffffff",
    borderColor: template === "basic" ? "#171717" : isDark ? "transparent" : "#e5e7eb",
    borderWidth: template === "basic" ? 2 : 1,
    borderRadius: template === "rounded" ? 16 : template === "practical" ? 12 : 8,
    categoryColor: isDark ? "#a3a3a3" : accent,
    titleColor: isDark ? "#ffffff" : "#171717",
    priceColor: accent,
    highlightColor: accent,
    tagColor: isDark ? "#d4d4d4" : "#171717",
    volumeColor: isDark ? "#d4d4d4" : "#374151",
    priceSuffixColor: isDark ? "#ffffff" : "#171717",
    ...(isPractical
      ? {
          brandFontSize: 11,
          tabInactiveFontSize: 11,
          titleFontSize: 15,
          tagFontSize: 10,
          priceFontSize: 13,
          tabBarHeight: 24,
          activeTabBorderWidth: 2,
        }
      : {}),
  };
}

export function createAllDefaultStyles(): Record<ProductTemplate, CardStyleConfig> {
  const templates: ProductTemplate[] = [
    "basic",
    "premium",
    "rounded",
    "line",
    "dark",
    "event",
    "set",
    "practical",
  ];
  return Object.fromEntries(templates.map((t) => [t, createDefaultStyle(t)])) as Record<
    ProductTemplate,
    CardStyleConfig
  >;
}

export function mergeStyle(
  base: CardStyleConfig,
  patch: Partial<CardStyleConfig>
): CardStyleConfig {
  return { ...base, ...patch };
}

/** 누락된 색상·크기 필드를 템플릿 기본값으로 채운 완전한 스타일 */
export function resolveStyle(
  template: ProductTemplate,
  partial?: Partial<CardStyleConfig> | null
): CardStyleConfig {
  return mergeStyle(createDefaultStyle(template), partial ?? {});
}
