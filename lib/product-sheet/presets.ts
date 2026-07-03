import { ProductSheetStyleConfig, createDefaultSheetStyle, migrateLegacySheetStyle } from "./styles";
import { uid } from "@/lib/utils";

export type ProductSheetPreset = {
  id: string;
  name: string;
  category: string;
  style: ProductSheetStyleConfig;
  savedAt: string;
};

export function createSheetPreset(
  name: string,
  category: string,
  style: ProductSheetStyleConfig
): ProductSheetPreset {
  return {
    id: uid("sheet-preset"),
    name: name.trim() || "시트 프리셋",
    category: category.trim() || "기본",
    style: { ...style },
    savedAt: new Date().toISOString(),
  };
}

export function normalizeSheetPresets(raw: unknown): ProductSheetPreset[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && typeof p === "object" && (p as ProductSheetPreset).id)
    .map((p) => {
      const preset = p as ProductSheetPreset;
      return {
        ...preset,
        style: migrateLegacySheetStyle({
          ...createDefaultSheetStyle(),
          ...preset.style,
          ...(preset.style?.headerRowHeight === 25 ? { headerRowHeight: 22 } : {}),
        }),
      };
    });
}
