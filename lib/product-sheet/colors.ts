import { SheetColorKey } from "./types";

export type SheetColorTheme = {
  label: string;
  topLine: string;
  highlight: string;
  price: string;
  thickTop?: boolean;
};

export const SHEET_COLOR_THEMES: Record<SheetColorKey, SheetColorTheme> = {
  repair: { label: "리페어 (빨강)", topLine: "#e11d48", highlight: "#e11d48", price: "#e11d48" },
  k: { label: "케이 (초록)", topLine: "#16a34a", highlight: "#16a34a", price: "#16a34a" },
  cica: { label: "시카 (보라)", topLine: "#7c3aed", highlight: "#7c3aed", price: "#7c3aed" },
  hyaluron: { label: "히알루론 (파랑)", topLine: "#2563eb", highlight: "#2563eb", price: "#2563eb" },
  sun: { label: "선블럭/브라이트닝 (노랑)", topLine: "#ca8a04", highlight: "#ca8a04", price: "#ca8a04" },
  retinol: { label: "레티놀 (핑크)", topLine: "#ec4899", highlight: "#2563eb", price: "#ec4899" },
  black: { label: "도미나/검정 (검정)", topLine: "#171717", highlight: "#171717", price: "#171717", thickTop: true },
  purple: { label: "멜라토닝/멜라논 (자주)", topLine: "#6b21a8", highlight: "#6b21a8", price: "#6b21a8" },
  egf: { label: "이지에프 (남색)", topLine: "#1e3a8a", highlight: "#16a34a", price: "#1e3a8a", thickTop: true },
  red: { label: "노드라나 (빨강)", topLine: "#dc2626", highlight: "#dc2626", price: "#dc2626" },
  blueDark: { label: "프로캄 (파랑)", topLine: "#1e40af", highlight: "#1e40af", price: "#1e40af", thickTop: true },
  hanmi: { label: "한미 (회색)", topLine: "#64748b", highlight: "#3b82f6", price: "#64748b" },
  ckdPink: { label: "종근당 핑크 (핑크)", topLine: "#ec4899", highlight: "#22c55e", price: "#ec4899" },
  ckdGreen: { label: "종근당 그린 (초록)", topLine: "#22c55e", highlight: "#22c55e", price: "#22c55e" },
};

export function getSheetColorTheme(color?: SheetColorKey): SheetColorTheme {
  return SHEET_COLOR_THEMES[color ?? "repair"] ?? SHEET_COLOR_THEMES.repair;
}
