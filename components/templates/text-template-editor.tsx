"use client";

import { useEffect, useState } from "react";
import { TextCardView } from "@/components/cards/text-card";
import { ResizablePreview } from "@/components/templates/resizable-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TextCardTemplate } from "@/lib/types";
import {
  TextCardDemoData,
  defaultTextCardDemo,
  demoToTextCard,
  resolveTextCardDemo,
} from "@/lib/text-card-demos";
import { useStore } from "@/lib/store";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";

const EMOJIS = ["", "🙂", "🌞", "💧", "❤️", "⚠️", "✅", "💊", "🧴"];

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-xs font-black text-muted-foreground">{title}</span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open ? <div className="border-t px-3 pb-3 pt-2">{children}</div> : null}
    </div>
  );
}

export function TextTemplateEditor({
  templateId,
  label,
  desc,
}: {
  templateId: TextCardTemplate;
  label: string;
  desc: string;
}) {
  const storedDemo = useStore((s) => s.textCardDemos[templateId]);
  const updateTextCardDemo = useStore((s) => s.updateTextCardDemo);

  const [open, setOpen] = useState(false);
  const [demo, setDemo] = useState<TextCardDemoData>(() =>
    resolveTextCardDemo(templateId, storedDemo)
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    content: true,
    text: false,
    colors: false,
    card: false,
  });

  useEffect(() => {
    if (storedDemo) setDemo(resolveTextCardDemo(templateId, storedDemo));
  }, [storedDemo, templateId]);

  const patch = (p: Partial<TextCardDemoData>) => {
    setDemo((d) => {
      const next = resolveTextCardDemo(templateId, { ...d, ...p });
      updateTextCardDemo(templateId, p);
      return next;
    });
  };

  const setHighlightWords = (raw: string) => {
    const highlightWords = raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    patch({ highlightWords });
  };

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const hlPreset =
    demo.highlightColor === "red" || demo.highlightColor === "blue" ? demo.highlightColor : "custom";
  const hlHex =
    demo.highlightColor?.startsWith("#") ? demo.highlightColor : demo.highlightColor === "red" ? "#dc2626" : "#2563eb";

  return (
    <div className="rounded-lg border bg-white">
      <div className="grid-paper flex justify-center rounded-t-lg p-3">
        <ResizablePreview
          width={demo.width ?? 280}
          height={demo.height ?? 210}
          onResize={(size) => patch(size)}
        >
          <div className="size-full">
            <TextCardView card={demoToTextCard(demo)} className="size-full" />
          </div>
        </ResizablePreview>
      </div>

      <div className="border-t px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold">{label}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            <Pencil className="size-3.5" />
            {open ? "닫기" : "편집"}
          </Button>
        </div>

        {open ? (
          <div className="mt-4 space-y-3 border-t pt-4">
            <p className="text-[11px] text-muted-foreground">
              미리보기를 드래그해 크기를 조절하고, 문구·색상·글씨 크기를 수정할 수 있습니다.
            </p>

            <CollapsibleSection
              title="문구"
              open={!!expanded.content}
              onToggle={() => toggle("content")}
            >
              <div className="space-y-3">
                <Field label="제목">
                  <Input value={demo.title} onChange={(e) => patch({ title: e.target.value })} />
                </Field>
                <Field label="설명 문구 (엔터로 줄바꿈)">
                  <Textarea
                    value={demo.content}
                    onChange={(e) => patch({ content: e.target.value })}
                    rows={3}
                  />
                </Field>
                <Field label="강조 단어 (쉼표로 구분)">
                  <Input
                    value={(demo.highlightWords ?? []).join(", ")}
                    onChange={(e) => setHighlightWords(e.target.value)}
                  />
                </Field>
                <Field label="이모지 (제목 옆)">
                  <Select
                    value={demo.emoji ?? ""}
                    onChange={(e) => patch({ emoji: e.target.value || undefined })}
                  >
                    {EMOJIS.map((e) => (
                      <option key={e || "none"} value={e}>
                        {e || "없음"}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="글씨 크기 · 색" open={!!expanded.text} onToggle={() => toggle("text")}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="제목 크기 (px)">
                  <Input
                    type="number"
                    value={demo.titleFontSize ?? 24}
                    onChange={(e) => patch({ titleFontSize: Number(e.target.value) })}
                  />
                </Field>
                <Field label="본문 크기 (px)">
                  <Input
                    type="number"
                    value={demo.contentFontSize ?? 20}
                    onChange={(e) => patch({ contentFontSize: Number(e.target.value) })}
                  />
                </Field>
                <Field label="제목 색">
                  <ColorInput
                    value={demo.titleColor ?? "#171717"}
                    onChange={(v) => patch({ titleColor: v })}
                  />
                </Field>
                <Field label="본문 색">
                  <ColorInput
                    value={demo.contentColor ?? "#262626"}
                    onChange={(v) => patch({ contentColor: v })}
                  />
                </Field>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="강조 · 배경 색" open={!!expanded.colors} onToggle={() => toggle("colors")}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="강조 색">
                  <Select
                    value={hlPreset}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "custom") patch({ highlightColor: hlHex });
                      else patch({ highlightColor: v });
                    }}
                  >
                    <option value="blue">파란색</option>
                    <option value="red">빨간색</option>
                    <option value="custom">직접 지정</option>
                  </Select>
                </Field>
                {hlPreset === "custom" ? (
                  <Field label="강조 색 (hex)">
                    <ColorInput value={hlHex} onChange={(v) => patch({ highlightColor: v })} />
                  </Field>
                ) : (
                  <Field label="강조 색 미리보기">
                    <ColorInput
                      value={hlHex}
                      onChange={(v) => patch({ highlightColor: v })}
                    />
                  </Field>
                )}
                <Field label="배경색">
                  <ColorInput
                    value={demo.backgroundColor ?? "#e0f2fe"}
                    onChange={(v) => patch({ backgroundColor: v })}
                  />
                </Field>
                <Field label="테두리색">
                  <ColorInput
                    value={demo.borderColor ?? "#7dd3fc"}
                    onChange={(v) => patch({ borderColor: v })}
                  />
                </Field>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="카드 · 테두리" open={!!expanded.card} onToggle={() => toggle("card")}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="너비 (px)">
                  <Input
                    type="number"
                    value={demo.width ?? 280}
                    onChange={(e) => patch({ width: Number(e.target.value) })}
                  />
                </Field>
                <Field label="높이 (px)">
                  <Input
                    type="number"
                    value={demo.height ?? 210}
                    onChange={(e) => patch({ height: Number(e.target.value) })}
                  />
                </Field>
                <Field label="테두리 두께">
                  <Input
                    type="number"
                    value={demo.borderWidth ?? 1}
                    onChange={(e) => patch({ borderWidth: Number(e.target.value) })}
                  />
                </Field>
                <Field label="모서리 둥글기">
                  <Input
                    type="number"
                    value={demo.borderRadius ?? 16}
                    onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-[10px]"
                onClick={() => {
                  const def = defaultTextCardDemo(templateId);
                  patch({
                    width: def.width,
                    height: def.height,
                    borderWidth: def.borderWidth,
                    borderRadius: def.borderRadius,
                  });
                }}
              >
                크기·테두리 기본값
              </Button>
            </CollapsibleSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px]">{label}</Label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const safe = value.startsWith("#") ? value : "#171717";
  return (
    <div className="flex gap-1">
      <input
        type="color"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1" />
    </div>
  );
}
