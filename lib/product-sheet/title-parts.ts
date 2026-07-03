import { getSheetColorTheme } from "./colors";
import { ProductSheetCardData } from "./types";

export type TitleLines = {
  primary: string;
  secondary?: string;
};

const PHRASES_BY_COLOR: Record<string, string[]> = {
  repair: ["리페어 크림", "리페어", "재생", "앰플", "로션", "토너", "마스크팩", "아이크림"],
  k: ["퓨리파잉 미스", "케어 크림", "케어", "인텐시브", "포밍", "클렌저", "퓨리파잉"],
  cica: ["시카", "캄", "진정"],
  hyaluron: ["히알루론", "보습", "수분"],
  sun: ["선블럭", "브라이트닝", "SPF"],
  retinol: ["레티놀", "주름"],
  black: ["색소", "침착", "도미나"],
  purple: ["멜라토닝", "멜라논", "기미"],
  red: ["노드라나", "건조", "피부건조증"],
  blueDark: ["프로캄"],
};

/** 1줄: 제품명, 2줄: 강조 키워드 */
export function buildTitleLines(card: ProductSheetCardData): TitleLines {
  if (card.highlight?.trim()) {
    return {
      primary: card.title.trim(),
      secondary: card.highlight.trim(),
    };
  }

  const phrases = PHRASES_BY_COLOR[card.color ?? "repair"] ?? [];
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    const idx = card.title.indexOf(phrase);
    if (idx < 0) continue;
    const before = card.title.slice(0, idx).trim();
    const after = card.title.slice(idx + phrase.length).trim();
    const primary = [before, after].filter(Boolean).join(" ");
    return {
      primary: primary || card.title.trim(),
      secondary: phrase,
    };
  }

  return { primary: card.title.trim() };
}

export function accentColorForCard(card: ProductSheetCardData): string {
  return getSheetColorTheme(card.color).highlight;
}
