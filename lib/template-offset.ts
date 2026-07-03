import { CardStyleConfig } from "./template-styles";

/** 텍스트 가로 위치 (0=왼쪽 끝, 50=가운데, 100=오른쪽 끝) */
export const OFFSET_MIN = 0;
export const OFFSET_MAX = 100;
export const OFFSET_CENTER = 50;

export function clampOffsetPercent(value: number | undefined): number {
  if (value == null || Number.isNaN(value)) return OFFSET_CENTER;
  return Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, Math.round(value)));
}

/** 예전 px 단위(±80 등) → 0~100% 로 변환 */
export function migrateOffsetToPercent(value: number, cardWidth: number): number {
  if (value > 100 || value < 0) {
    const half = Math.max(80, Math.round(cardWidth * 0.45));
    return clampOffsetPercent(OFFSET_CENTER + (value / half) * 50);
  }
  if (value === 0) return OFFSET_CENTER;
  return clampOffsetPercent(value);
}

export function migrateStyleOffsets(style: CardStyleConfig): CardStyleConfig {
  return {
    ...style,
    brandOffsetX: migrateOffsetToPercent(style.brandOffsetX ?? OFFSET_CENTER, style.width),
    categoryOffsetX: migrateOffsetToPercent(style.categoryOffsetX ?? OFFSET_CENTER, style.width),
  };
}
