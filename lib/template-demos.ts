import { CardStyleConfig } from "./template-styles";
import { ProductItem, ProductTemplate } from "./types";
import { PRODUCT_TEMPLATES } from "./templates";

/** 템플릿 미리보기용 문구 (상품 카드 데모) */
export interface TemplateDemoData {
  brand?: string;
  category?: string;
  tab2?: string;
  name: string;
  highlightWords?: string[];
  volume?: string;
  price: number;
  tags?: string[];
}

export function defaultDemoForTemplate(template: ProductTemplate): TemplateDemoData {
  const base: TemplateDemoData = {
    brand: "유쏘",
    name: "센시티브 퓨리파잉 미스",
    category: "바이오",
    highlightWords: ["퓨리파잉"],
    tags: ["보습", "진정", "영양", "티트리추출물함유"],
    volume: "150ml",
    price: 32000,
  };
  if (template === "practical") {
    return {
      ...base,
      category: "스킨케어",
      tab2: "바이오",
    };
  }
  if (template === "basic" || template === "rounded" || template === "line") {
    return {
      ...base,
      brand: undefined,
      name: "핸드 우레아 크림",
      category: "스킨케어",
      highlightWords: undefined,
      tags: undefined,
      volume: "50ml",
      price: 15000,
    };
  }
  return base;
}

export function createDefaultTemplateDemos(): Record<ProductTemplate, TemplateDemoData> {
  return Object.fromEntries(
    PRODUCT_TEMPLATES.map((t) => [t.id, defaultDemoForTemplate(t.id)])
  ) as Record<ProductTemplate, TemplateDemoData>;
}

export function buildTemplateDemoItem(
  template: ProductTemplate,
  demo: TemplateDemoData,
  style: CardStyleConfig
): ProductItem {
  return {
    id: "demo",
    templateType: template,
    cardColor: style.accentColor,
    ...demo,
  };
}

/** 템플릿 미리보기에서 상단 라벨로 보이는 문구 (실무용=탭2, 그 외=카테고리) */
export function resolveTemplateTabLabel(
  template: ProductTemplate,
  demo: Pick<TemplateDemoData, "category" | "tab2">
): string {
  if (template === "practical") return demo.tab2 ?? demo.category ?? "";
  return demo.category ?? demo.tab2 ?? "";
}

/** 템플릿 일괄 편집 시 탭2·카테고리를 동일 값으로 저장 */
export function templateTabLabelPatch(value: string): Pick<TemplateDemoData, "category" | "tab2"> {
  const v = value.trim() || undefined;
  return { category: v, tab2: v };
}

/** 숫자만 입력 시 ml 자동 추가, 그 외는 입력값 그대로 */
export function normalizeVolume(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) return `${trimmed}ml`;
  return trimmed;
}
