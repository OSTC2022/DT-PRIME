"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PriceCard } from "@/components/cards/price-card";
import { ResizablePreview } from "@/components/templates/resizable-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductTemplate } from "@/lib/types";
import { CardStyleConfig, TemplatePreset, createDefaultStyle, resolveStyle } from "@/lib/template-styles";
import { COLLAPSIBLE_SECTIONS, STYLE_GROUPS } from "@/lib/template-style-fields";
import {
  buildTemplateDemoItem,
  defaultDemoForTemplate,
  normalizeVolume,
  resolveTemplateTabLabel,
  TemplateDemoData,
} from "@/lib/template-demos";
import { useStore } from "@/lib/store";
import { ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown, Copy, Pencil, RotateCcw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OFFSET_CENTER } from "@/lib/template-offset";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TemplatePresetPicker } from "@/components/templates/template-preset-picker";
import { HorizontalOffsetSlider } from "@/components/templates/horizontal-offset-slider";
import { StickyPreviewPanel } from "@/components/templates/sticky-preview-panel";

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
        {open ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {open ? <div className="border-t px-3 pb-3 pt-2">{children}</div> : null}
    </div>
  );
}

export function ProductTemplateEditor({
  templateId,
  label,
  desc,
  isDefault = false,
  cloneId,
}: {
  templateId: ProductTemplate;
  label: string;
  desc: string;
  isDefault?: boolean;
  cloneId?: string;
}) {
  const storedStyle = useStore((s) => s.templateStyles[templateId]);
  const storedDemo = useStore((s) => s.templateDemos[templateId]);
  const storedClone = useStore((s) =>
    cloneId ? s.templateClones.find((c) => c.id === cloneId) : undefined
  );
  const {
    updateTemplateStyle,
    updateTemplateDemo,
    updateTemplateClone,
    cloneTemplateCardAfter,
    trashTemplateClone,
  } = useStore();

  const isClone = !!cloneId;
  const displayLabel = isClone ? (storedClone?.label ?? label) : label;
  const displayDesc = isClone ? `${desc} · 복제 카드` : desc;

  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CardStyleConfig>(() => {
    if (cloneId && storedClone) return storedClone.style;
    return storedStyle ?? createDefaultStyle(templateId);
  });
  const [demo, setDemo] = useState<TemplateDemoData>(() => {
    if (cloneId && storedClone) return storedClone.demo;
    return storedDemo ?? defaultDemoForTemplate(templateId);
  });
  const [previewing, setPreviewing] = useState(false);
  const [presetManual, setPresetManual] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const revertRef = useRef<{ style: CardStyleConfig; demo: TemplateDemoData } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const allSectionIds = COLLAPSIBLE_SECTIONS.map((s) => s.id);
  const allExpanded = allSectionIds.every((id) => expanded[id]);
  const expandAll = () => setExpanded(Object.fromEntries(allSectionIds.map((id) => [id, true])));
  const collapseAll = () => setExpanded(Object.fromEntries(allSectionIds.map((id) => [id, false])));
  const toggleSection = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (!previewing && storedClone && cloneId) {
      setStyle(storedClone.style);
      setDemo(storedClone.demo);
    }
  }, [storedClone, previewing, cloneId]);

  useEffect(() => {
    if (!previewing && !cloneId && storedStyle) setStyle(storedStyle);
  }, [storedStyle, previewing, cloneId]);

  useEffect(() => {
    if (!previewing && !cloneId && storedDemo) setDemo(storedDemo);
  }, [storedDemo, previewing, cloneId]);

  const persistStyle = (patch: Partial<CardStyleConfig>) => {
    if (cloneId) updateTemplateClone(cloneId, { style: patch });
    else updateTemplateStyle(templateId, patch);
  };

  const persistDemo = (patch: Partial<TemplateDemoData>) => {
    if (cloneId) {
      if (patch.name != null) {
        updateTemplateClone(cloneId, { demo: patch, label: String(patch.name) });
      } else {
        updateTemplateClone(cloneId, { demo: patch });
      }
      return;
    }
    updateTemplateDemo(templateId, patch);
  };

  const patchStyle = (patch: Partial<CardStyleConfig>) => {
    if (previewing) {
      toast.error("미리보기 중입니다. 먼저 확인하거나 취소해 주세요.");
      return;
    }
    const next = { ...style, ...patch };
    setStyle(next);
    persistStyle(patch);
  };

  const setDemoField = (key: keyof TemplateDemoData, value: string | number) => {
    setDemo((d) => {
      let patch: Partial<TemplateDemoData>;
      if (key === "price") {
        patch = { price: Number(value) || 0 };
      } else if (key === "highlightWords") {
        patch = {
          highlightWords: String(value)
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean),
        };
      } else if (key === "tags") {
        patch = { tags: String(value).split(/[#,\s]+/).filter(Boolean) };
      } else if (key === "volume") {
        patch = { volume: String(value) };
      } else {
        patch = { [key]: value } as Partial<TemplateDemoData>;
      }
      const next = { ...d, ...patch };
      persistDemo(patch);
      return next;
    });
  };

  const handleClone = () => {
    if (previewing) {
      toast.error("미리보기 중입니다. 먼저 확인하거나 취소해 주세요.");
      return;
    }
    const createdLabel = cloneTemplateCardAfter(cloneId ? { cloneId } : { templateId });
    if (createdLabel) toast.success(`"${createdLabel}" 카드를 아래에 추가했어요.`);
  };

  const handleTrash = () => {
    if (!cloneId) return;
    if (previewing) {
      toast.error("미리보기 중입니다. 먼저 확인하거나 취소해 주세요.");
      return;
    }
    setConfirmDelete(true);
  };

  const confirmTrash = () => {
    if (!cloneId) return;
    trashTemplateClone(cloneId);
    setConfirmDelete(false);
    setOpen(false);
    toast.success(`"${displayLabel}" 카드를 휴지통으로 옮겼어요.`);
  };

  const handleVolumeBlur = () => {
    const normalized = normalizeVolume(demo.volume ?? "");
    if (normalized !== (demo.volume ?? "")) {
      setDemoField("volume", normalized);
    }
  };

  const resetTextPositions = () => {
    if (previewing) {
      toast.error("미리보기 중입니다. 먼저 확인하거나 취소해 주세요.");
      return;
    }
    patchStyle({ brandOffsetX: OFFSET_CENTER, categoryOffsetX: OFFSET_CENTER });
    toast.success("브랜드·탭2·카테고리 글씨 위치를 가운데로 초기화했어요.");
  };

  const demoWithColor = useMemo(
    () => buildTemplateDemoItem(templateId, demo, style),
    [demo, style, templateId]
  );

  const onPresetPreview = (preset: TemplatePreset) => {
    if (!previewing) {
      revertRef.current = { style: { ...style }, demo: { ...demo } };
    }
    setPreviewing(true);
    setStyle(resolveStyle(templateId, preset.style));
    if (preset.demo) {
      const manualOnly: Partial<TemplateDemoData> = {};
      if (preset.demo.name) manualOnly.name = preset.demo.name;
      if (preset.demo.highlightWords) manualOnly.highlightWords = preset.demo.highlightWords;
      if (preset.demo.volume) manualOnly.volume = preset.demo.volume;
      if (preset.demo.tags) manualOnly.tags = preset.demo.tags;
      if (preset.demo.price != null) manualOnly.price = preset.demo.price;
      setDemo((d) => ({ ...d, ...manualOnly }));
    }
  };

  const onPresetConfirm = (preset: TemplatePreset) => {
    const resolved = resolveStyle(templateId, preset.style);
    persistStyle(resolved);
    setStyle(resolved);
    if (preset.demo) {
      const manualOnly: Partial<TemplateDemoData> = {};
      if (preset.demo.name) manualOnly.name = preset.demo.name;
      if (preset.demo.highlightWords) manualOnly.highlightWords = preset.demo.highlightWords;
      if (preset.demo.volume) manualOnly.volume = preset.demo.volume;
      if (preset.demo.tags) manualOnly.tags = preset.demo.tags;
      if (preset.demo.price != null) manualOnly.price = preset.demo.price;
      if (Object.keys(manualOnly).length > 0) {
        persistDemo(manualOnly);
        setDemo((d) => ({ ...d, ...manualOnly }));
      }
    }
    setPreviewing(false);
    revertRef.current = null;
  };

  const onPresetCancel = () => {
    if (revertRef.current) {
      setStyle(revertRef.current.style);
      setDemo(revertRef.current.demo);
    } else if (cloneId && storedClone) {
      setStyle(storedClone.style);
      setDemo(storedClone.demo);
    } else {
      if (storedStyle) setStyle(storedStyle);
      if (storedDemo) setDemo(storedDemo);
    }
    setPreviewing(false);
    revertRef.current = null;
  };

  return (
    <div
      id={isDefault && !isClone ? "representative-template" : undefined}
      className={`relative rounded-lg border bg-white ${isDefault && !isClone ? "ring-2 ring-amber-400" : isClone ? "ring-1 ring-blue-200" : ""}`}
    >
      {isClone ? (
        <button
          type="button"
          onClick={handleTrash}
          disabled={previewing}
          className="absolute right-2 top-2 z-20 rounded-md border bg-background/95 p-1.5 text-muted-foreground shadow-sm transition hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
          title="휴지통으로 이동"
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
      <ConfirmDialog
        open={confirmDelete}
        title="복제 카드를 삭제할까요?"
        message={`"${displayLabel}" 카드를 휴지통으로 옮깁니다. 화면 오른쪽 아래 휴지통에서 복구할 수 있습니다.`}
        confirmLabel="예"
        cancelLabel="아니요"
        onConfirm={confirmTrash}
        onCancel={() => setConfirmDelete(false)}
      />
      {isDefault && !isClone ? (
        <div className="flex items-center gap-1.5 rounded-t-lg bg-amber-400 px-3 py-1.5 text-[11px] font-black text-amber-950">
          <Star className="size-3 fill-current" /> 대표 카드
        </div>
      ) : null}
      <StickyPreviewPanel
        active={open}
        className={cn(isDefault ? "" : "rounded-t-lg", previewing ? "ring-2 ring-primary ring-offset-2" : "")}
      >
        <ResizablePreview
          width={style.width}
          height={style.height}
          onResize={(size) => patchStyle(size)}
        >
          <PriceCard item={demoWithColor} styleConfig={style} />
        </ResizablePreview>
      </StickyPreviewPanel>

      <div className="border-t px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold">{displayLabel}</div>
            <div className="text-xs text-muted-foreground">{displayDesc}</div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="outline" size="sm" onClick={handleClone} disabled={previewing}>
              <Copy className="size-3.5" />
              복제
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
              <Pencil className="size-3.5" />
              {open ? "닫기" : "편집"}
            </Button>
          </div>
        </div>

        {open && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div>
              <h4 className="mb-2 text-xs font-black text-muted-foreground">미리보기 문구 (이 템플릿만)</h4>
              <p className="mb-2 text-[11px] text-muted-foreground">
                브랜드·탭2·카테고리는 위 일괄 편집에서 변경하세요.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="상품명" className="col-span-2">
                  <Input value={demo.name} onChange={(e) => setDemoField("name", e.target.value)} />
                </Field>
                <Field label="강조 단어">
                  <Input
                    value={(demo.highlightWords ?? []).join(", ")}
                    onChange={(e) => setDemoField("highlightWords", e.target.value)}
                    placeholder="퓨리파잉"
                  />
                </Field>
                <Field label="용량">
                  <Input
                    value={demo.volume ?? ""}
                    onChange={(e) => setDemoField("volume", e.target.value)}
                    onBlur={handleVolumeBlur}
                    placeholder="150 또는 150ml"
                  />
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-black text-muted-foreground">상세 설정</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={allExpanded ? collapseAll : expandAll}
              >
                {allExpanded ? (
                  <>
                    <ChevronsDownUp className="size-3.5" /> 전체 접기
                  </>
                ) : (
                  <>
                    <ChevronsUpDown className="size-3.5" /> 전체 펼치기
                  </>
                )}
              </Button>
            </div>

            <CollapsibleSection
              title="기타 미리보기 문구"
              open={!!expanded["extra-demo"]}
              onToggle={() => toggleSection("extra-demo")}
            >
              <div className="grid grid-cols-2 gap-2">
                <Field label="해시태그">
                  <Input
                    value={(demo.tags ?? []).map((t) => `#${t}`).join(" ")}
                    onChange={(e) => setDemoField("tags", e.target.value)}
                  />
                </Field>
                <Field label="가격">
                  <Input
                    inputMode="numeric"
                    value={String(demo.price)}
                    onChange={(e) => setDemoField("price", e.target.value)}
                  />
                </Field>
              </div>
            </CollapsibleSection>

            {STYLE_GROUPS.map((group) => (
              <CollapsibleSection
                key={group.title}
                title={group.title}
                open={!!expanded[group.title]}
                onToggle={() => toggleSection(group.title)}
              >
                {group.title === "글씨 — 브랜드 · 카테고리" ? (
                  <>
                    <div className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <HorizontalOffsetSlider
                        label="브랜드 위치"
                        previewText={demo.brand}
                        value={style.brandOffsetX ?? 50}
                        onChange={(v) => patchStyle({ brandOffsetX: v })}
                        disabled={previewing}
                      />
                      <HorizontalOffsetSlider
                        label="탭2 · 카테고리 위치"
                        previewText={resolveTemplateTabLabel(templateId, demo)}
                        value={style.categoryOffsetX ?? 50}
                        onChange={(v) => patchStyle({ categoryOffsetX: v })}
                        disabled={previewing}
                      />
                    </div>
                    <div className="mb-3 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px]"
                        disabled={previewing}
                        onClick={resetTextPositions}
                      >
                        <RotateCcw className="size-3.5" /> 위치 초기화
                      </Button>
                    </div>
                  </>
                ) : null}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.fields.map((f) => (
                    <Field key={f.key} label={f.label}>
                      {f.type === "color" ? (
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={String(style[f.key]).startsWith("#") ? String(style[f.key]) : "#ffffff"}
                            onChange={(e) => patchStyle({ [f.key]: e.target.value })}
                            className="h-9 w-10 cursor-pointer rounded border"
                          />
                          <Input
                            value={String(style[f.key])}
                            onChange={(e) => patchStyle({ [f.key]: e.target.value })}
                            className="min-w-0 flex-1"
                          />
                        </div>
                      ) : (
                        <Input
                          type="number"
                          value={Number(style[f.key])}
                          onChange={(e) => patchStyle({ [f.key]: Number(e.target.value) })}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              </CollapsibleSection>
            ))}

            <TemplatePresetPicker
              templateType={templateId}
              demo={demoWithColor}
              currentStyle={style}
              syncTabLabel={resolveTemplateTabLabel(templateId, demo)}
              presetManual={presetManual}
              onPresetManualChange={setPresetManual}
              showAllPresets
              showReset
              onPreview={onPresetPreview}
              onConfirm={onPresetConfirm}
              onCancel={onPresetCancel}
              onReset={() => {
                if (previewing) onPresetCancel();
                setStyle(createDefaultStyle(templateId));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-[11px]">{label}</Label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
