import { TextCard, TextCardTemplate } from "./types";
import { TEXT_TEMPLATES } from "./templates";
import { defaultTextCardStyle } from "./text-card-styles";

export type TextCardDemoData = Omit<TextCard, "id">;

export function defaultTextCardDemo(template: TextCardTemplate): TextCardDemoData {
  const style = defaultTextCardStyle(template);
  switch (template) {
    case "yellow":
      return {
        ...style,
        title: "감기&몸살 때",
        content: '"아연 비타민B,C"\n같이 드세요',
        highlightWords: ["아연 비타민B,C"],
        highlightColor: "red",
        emoji: "🙂",
        templateType: "yellow",
      };
    case "rounded":
      return {
        ...style,
        title: "🌞무더위",
        content: "땀과다&목마름에\n마시는 여름보약!",
        highlightWords: ["여름보약"],
        highlightColor: "blue",
        templateType: "rounded",
      };
    case "outline":
      return {
        ...style,
        title: "안내",
        content: "직원에게\n문의해 주세요",
        highlightWords: ["문의"],
        highlightColor: "red",
        templateType: "outline",
      };
    default:
      return {
        ...style,
        title: '"설사" 시',
        content: "마시는 수액!",
        highlightWords: ["수액"],
        highlightColor: "blue",
        templateType: "sky",
      };
  }
}

export function resolveTextCardDemo(
  template: TextCardTemplate,
  partial?: Partial<TextCardDemoData> | null
): TextCardDemoData {
  return { ...defaultTextCardDemo(template), ...partial };
}

export function createDefaultTextCardDemos(): Record<TextCardTemplate, TextCardDemoData> {
  return Object.fromEntries(
    TEXT_TEMPLATES.map((t) => [t.id, defaultTextCardDemo(t.id)])
  ) as Record<TextCardTemplate, TextCardDemoData>;
}

export function demoToTextCard(demo: TextCardDemoData): TextCard {
  return { id: "demo", ...demo, highlightWords: demo.highlightWords ?? [] };
}
