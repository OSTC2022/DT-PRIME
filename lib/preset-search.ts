import { TemplatePreset } from "./template-styles";

const UNCATEGORIZED = "미분류";
const NO_BRAND = "브랜드 미지정";

export function presetCategory(preset: TemplatePreset): string {
  return preset.category?.trim() || preset.demo?.category?.trim() || UNCATEGORIZED;
}

/** 상품명·브랜드·카테고리·프리셋 이름으로 검색 */
export function filterPresets(presets: TemplatePreset[], query: string): TemplatePreset[] {
  const q = query.trim().toLowerCase();
  if (!q) return presets;
  return presets.filter((p) => {
    const haystack = [
      p.name,
      presetCategory(p),
      p.demo?.name,
      p.demo?.brand,
      p.demo?.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function presetBrand(preset: TemplatePreset): string {
  return preset.demo?.brand?.trim() || NO_BRAND;
}

export function groupPresetsByCategory(presets: TemplatePreset[]): { category: string; items: TemplatePreset[] }[] {
  const map = new Map<string, TemplatePreset[]>();
  for (const p of presets) {
    const cat = presetCategory(p);
    const list = map.get(cat) ?? [];
    list.push(p);
    map.set(cat, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === UNCATEGORIZED) return 1;
      if (b === UNCATEGORIZED) return -1;
      return a.localeCompare(b, "ko");
    })
    .map(([category, items]) => ({ category, items }));
}

export type PresetCategoryBrandGroup = {
  category: string;
  brands: { brand: string; items: TemplatePreset[] }[];
};

export function groupPresetsByCategoryAndBrand(presets: TemplatePreset[]): PresetCategoryBrandGroup[] {
  return groupPresetsByCategory(presets).map(({ category, items }) => {
    const brandMap = new Map<string, TemplatePreset[]>();
    for (const p of items) {
      const brand = presetBrand(p);
      const list = brandMap.get(brand) ?? [];
      list.push(p);
      brandMap.set(brand, list);
    }
    const brands = Array.from(brandMap.entries())
      .sort(([a], [b]) => {
        if (a === NO_BRAND) return 1;
        if (b === NO_BRAND) return -1;
        return a.localeCompare(b, "ko");
      })
      .map(([brand, brandItems]) => ({ brand, items: brandItems }));
    return { category, brands };
  });
}

export function presetBrandKey(category: string, brand: string): string {
  return `${category}::${brand}`;
}

export function collectPresetCategories(presets: TemplatePreset[]): string[] {
  const set = new Set<string>();
  for (const p of presets) {
    const cat = presetCategory(p);
    if (cat !== UNCATEGORIZED) set.add(cat);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

export function presetSearchLabel(preset: TemplatePreset): string {
  const parts = [preset.demo?.name, preset.demo?.brand, preset.demo?.category].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "";
}
