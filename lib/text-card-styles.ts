import { TextCardTemplate } from "./types";

export interface TextCardStyleFields {
  width: number;
  height: number;
  titleFontSize: number;
  contentFontSize: number;
  titleColor: string;
  contentColor: string;
  borderWidth: number;
  borderRadius: number;
}

export function defaultTextCardStyle(template: TextCardTemplate): TextCardStyleFields {
  const isOutline = template === "outline";
  return {
    width: 280,
    height: 210,
    titleFontSize: 24,
    contentFontSize: 20,
    titleColor: "#171717",
    contentColor: "#262626",
    borderWidth: isOutline ? 2 : 1,
    borderRadius: isOutline ? 6 : 16,
  };
}

export function resolveHighlightColor(highlightColor?: string): string {
  if (!highlightColor) return "hsl(var(--brand-blue))";
  if (highlightColor.startsWith("#") || highlightColor.startsWith("hsl")) return highlightColor;
  if (highlightColor === "red") return "hsl(var(--brand-red))";
  return "hsl(var(--brand-blue))";
}
