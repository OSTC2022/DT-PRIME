import { CardStyleConfig } from "./template-styles";
import { TemplateDemoData } from "./template-demos";
import { ProductTemplate } from "./types";

export interface TemplateCardClone {
  id: string;
  sourceTemplateId: ProductTemplate;
  /** 카드 목록 표시명 */
  label: string;
  demo: TemplateDemoData;
  style: CardStyleConfig;
  /** 같은 원본 템플릿 내 표시 순서 */
  sortOrder: number;
}

export interface TrashedTemplateCardClone extends TemplateCardClone {
  deletedAt: string;
}

export function copyTemplateDemo(demo: TemplateDemoData): TemplateDemoData {
  return {
    ...demo,
    highlightWords: demo.highlightWords ? [...demo.highlightWords] : undefined,
    tags: demo.tags ? [...demo.tags] : undefined,
  };
}

export function copyCardStyle(style: CardStyleConfig): CardStyleConfig {
  return { ...style };
}

export function clonesForTemplate(clones: TemplateCardClone[], templateId: ProductTemplate): TemplateCardClone[] {
  return clones
    .filter((c) => c.sourceTemplateId === templateId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
