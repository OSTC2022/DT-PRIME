"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TextCardView } from "@/components/cards/text-card";
import { DownloadBar } from "@/components/products/download-bar";
import { PrintCardButton } from "@/components/ui/print-card-button";
import { printCardById } from "@/lib/print";
import { TEXT_TEMPLATES } from "@/lib/templates";
import { TextCardDemoData } from "@/lib/text-card-demos";
import { TextCardTemplate } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";
import { toast } from "sonner";

const EMOJIS = ["", "🙂", "🌞", "💧", "❤️", "⚠️", "✅", "💊", "🧴"];

function styleFromDemo(d: TextCardDemoData) {
  return {
    width: d.width,
    height: d.height,
    titleFontSize: d.titleFontSize,
    contentFontSize: d.contentFontSize,
    titleColor: d.titleColor,
    contentColor: d.contentColor,
    borderWidth: d.borderWidth,
    borderRadius: d.borderRadius,
  };
}

function demoToForm(d: TextCardDemoData) {
  return {
    title: d.title,
    content: d.content,
    highlight: (d.highlightWords ?? []).join(", "),
    highlightColor: (d.highlightColor === "red" ? "red" : "blue") as "blue" | "red",
    emoji: d.emoji ?? "",
    backgroundColor: d.backgroundColor ?? "",
    borderColor: d.borderColor ?? "",
  };
}

export default function TextCardsPage() {
  const cards = useStore((s) => s.textCards);
  const textCardDemos = useStore((s) => s.textCardDemos);
  const { addTextCard, removeTextCard } = useStore();

  const [template, setTemplate] = useState<TextCardTemplate>("sky");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [highlight, setHighlight] = useState("");
  const [highlightColor, setHighlightColor] = useState<"blue" | "red">("blue");
  const [emoji, setEmoji] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [borderColor, setBorderColor] = useState("");

  const applyTemplateDemo = (t: TextCardTemplate) => {
    const d = textCardDemos[t];
    if (!d) return;
    const f = demoToForm(d);
    setTitle(f.title);
    setContent(f.content);
    setHighlight(f.highlight);
    setHighlightColor(f.highlightColor);
    setEmoji(f.emoji);
    setBackgroundColor(f.backgroundColor);
    setBorderColor(f.borderColor);
  };

  const mounted = useMounted();
  useEffect(() => {
    if (mounted) applyTemplateDemo(template);
  }, [mounted, template, textCardDemos]);
  if (!mounted) return <div className="p-5 text-muted-foreground">불러오는 중…</div>;

  const submit = () => {
    if (!title.trim() && !content.trim()) {
      toast.error("제목 또는 문구를 입력해 주세요.");
      return;
    }
    addTextCard({
      title: title.trim(),
      content: content,
      highlightWords: highlight.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
      highlightColor,
      emoji: emoji || undefined,
      backgroundColor: backgroundColor.trim() || undefined,
      borderColor: borderColor.trim() || undefined,
      templateType: template,
      ...styleFromDemo(textCardDemos[template]),
    });
    toast.success("안내 카드를 추가했어요.");
    applyTemplateDemo(template);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]">
      <section className="no-print border-b p-5 lg:border-b-0 lg:border-r">
        <h1 className="text-lg font-black">안내 문구 카드</h1>
        <p className="mb-4 text-sm text-muted-foreground">약국·매장용 짧은 추천 문구 카드를 만듭니다.</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='"설사" 시' />
          </div>
          <div className="space-y-1.5">
            <Label>설명 문구 (엔터로 줄바꿈)</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={"마시는 수액!"} />
          </div>
          <div className="space-y-1.5">
            <Label>강조 단어 (쉼표로 구분)</Label>
            <Input value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="수액, 여름보약" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>강조 색상</Label>
              <Select value={highlightColor} onChange={(e) => setHighlightColor(e.target.value as "blue" | "red")}>
                <option value="blue">파란색</option>
                <option value="red">빨간색</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>이모지</Label>
              <Select value={emoji} onChange={(e) => setEmoji(e.target.value)}>
                {EMOJIS.map((e) => <option key={e || "none"} value={e}>{e || "없음"}</option>)}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>템플릿</Label>
            <Select
              value={template}
              onChange={(e) => setTemplate(e.target.value as TextCardTemplate)}
            >
              {TEXT_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
            <p className="text-[11px] text-muted-foreground">
              템플릿을 바꾸면 카드 템플릿 관리에 저장된 기본 문구가 입력란에 채워집니다.
            </p>
          </div>
          <Button onClick={submit} size="lg" className="w-full">
            <Plus /> 안내 카드 추가
          </Button>
        </div>
      </section>

      <section className="print-area p-5">
        <div className="no-print mb-4 flex items-center gap-2">
          <Badge variant="secondary">총 {cards.length}개</Badge>
          <div className="ml-auto"><DownloadBar /></div>
        </div>
        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center text-muted-foreground">
            왼쪽에서 문구를 입력하면 카드가 나타납니다.
          </div>
        ) : (
          <div className="grid-paper grid gap-4 rounded-lg border p-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((c) => (
              <div
                key={c.id}
                data-print-card={c.id}
                className="group relative cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest(".no-print")) return;
                  printCardById(c.id);
                }}
                title="클릭하면 이 카드만 인쇄"
              >
                <div className="no-print absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <PrintCardButton cardId={c.id} />
                  <button
                    onClick={() => removeTextCard(c.id)}
                    className="rounded bg-red-600/90 p-1 text-white"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <TextCardView card={c} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
