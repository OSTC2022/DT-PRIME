"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PriceCard } from "@/components/cards/price-card";
import { ResizablePreview } from "@/components/templates/resizable-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductTemplate } from "@/lib/types";
import { CardStyleConfig, TemplatePreset, createDefaultStyle, resolveStyle } from "@/lib/template-styles";
import { BULK_COLLAPSIBLE_SECTIONS, STYLE_GROUPS, pickBulkStyle } from "@/lib/template-style-fields";
import {
  buildTemplateDemoItem,
  defaultDemoForTemplate,
  resolveTemplateTabLabel,
  templateTabLabelPatch,
  TemplateDemoData,
} from "@/lib/template-demos";
import { PRODUCT_TEMPLATES } from "@/lib/templates";
import { useStore } from "@/lib/store";
import { OFFSET_CENTER } from "@/lib/template-offset";
import { ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown, Layers, RotateCcw, Star } from "lucide-react";
import { toast } from "sonner";
import { TemplatePresetPicker } from "@/components/templates/template-preset-picker";
import { HorizontalOffsetSlider } from "@/components/templates/horizontal-offset-slider";
import { StickyPreviewPanel } from "@/components/templates/sticky-preview-panel";
import { SavedNameField } from "@/components/templates/saved-name-field";

const ALL_TEMPLATE_IDS = PRODUCT_TEMPLATES.map((t) => t.id);

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

export function ProductTemplateBulkEditor() {
  const templateStyles = useStore((s) => s.templateStyles);
  const templateDemos = useStore((s) => s.templateDemos);
  const defaultTemplateId = useStore((s) => s.defaultTemplateId);
  const savedBrandNames = useStore((s) => s.savedBrandNames);
  const savedCategoryNames = useStore((s) => s.savedCategoryNames);
  const savedTab2Names = useStore((s) => s.savedTab2Names);
  const trashedBrandNames = useStore((s) => s.trashedBrandNames);
  const trashedCategoryNames = useStore((s) => s.trashedCategoryNames);
  const trashedTab2Names = useStore((s) => s.trashedTab2Names);
  const {
    syncSelectedTemplateStyles,
    syncSelectedTemplateDemos,
    resetSelectedTemplateBulkStyles,
    setDefaultTemplate,
    saveBrandName,
    saveCategoryName,
    saveTab2Name,
    removeSavedBrandName,
    removeSavedCategoryName,
    removeSavedTab2Name,
    restoreSavedBrandName,
    restoreSavedCategoryName,
    restoreSavedTab2Name,
  } = useStore();

  const [selected, setSelected] = useState<Set<ProductTemplate>>(() => new Set(ALL_TEMPLATE_IDS));
  const [focusedTemplateId, setFocusedTemplateId] = useState<ProductTemplate>(defaultTemplateId);
  const defaultStyle = templateStyles[defaultTemplateId] ?? createDefaultStyle(defaultTemplateId);
  const [style, setStyle] = useState<CardStyleConfig>(() => defaultStyle);
  const [brand, setBrand] = useState(() => templateDemos[defaultTemplateId]?.brand ?? "유쏘");
  const [category, setCategory] = useState(() => templateDemos[defaultTemplateId]?.category ?? "바이오");
  const [tab2, setTab2] = useState(() => templateDemos[defaultTemplateId]?.tab2 ?? "바이오");
  const [previewing, setPreviewing] = useState(false);
  const [presetManual, setPresetManual] = useState(false);
  const revertRef = useRef<{ style: CardStyleConfig; brand: string; category: string; tab2: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const selectedList = useMemo(() => Array.from(selected), [selected]);
  const previewTemplate = focusedTemplateId;
  const previewDemo = templateDemos[previewTemplate] ?? defaultDemoForTemplate(previewTemplate);
  const tabLabel = resolveTemplateTabLabel(previewTemplate, { category, tab2 });
  const mergedTabLabelNames = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of [...savedCategoryNames, ...savedTab2Names]) {
      if (!seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  }, [savedCategoryNames, savedTab2Names]);
  const mergedTrashedTabLabelNames = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of [...trashedCategoryNames, ...trashedTab2Names]) {
      if (!seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  }, [trashedCategoryNames, trashedTab2Names]);
  const focusedLabel = PRODUCT_TEMPLATES.find((t) => t.id === focusedTemplateId)?.label ?? focusedTemplateId;
  const isFocusedDefault = focusedTemplateId === defaultTemplateId;

  const allSectionIds = BULK_COLLAPSIBLE_SECTIONS.map((s) => s.id);
  const allExpanded = allSectionIds.every((id) => expanded[id]);
  const expandAll = () => setExpanded(Object.fromEntries(allSectionIds.map((id) => [id, true])));
  const collapseAll = () => setExpanded(Object.fromEntries(allSectionIds.map((id) => [id, false])));
  const toggleSection = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    setFocusedTemplateId(defaultTemplateId);
  }, [defaultTemplateId]);

  useEffect(() => {
    if (!previewing) setPresetManual(false);
  }, [focusedTemplateId, previewing]);

  useEffect(() => {
    if (!previewing) {
      const ds = templateStyles[focusedTemplateId];
      if (ds) setStyle(ds);
      const dd = templateDemos[focusedTemplateId];
      if (dd) {
        if (dd.brand != null) setBrand(dd.brand);
        const label = resolveTemplateTabLabel(focusedTemplateId, dd);
        setCategory(label);
        setTab2(label);
      }
    }
  }, [templateStyles, templateDemos, focusedTemplateId, previewing]);

  const requireSelected = (): ProductTemplate[] | null => {
    if (selectedList.length === 0) {
      toast.error("위 미리보기에서 적용할 템플릿을 체크해 주세요.");
      return null;
    }
    return selectedList;
  };

  const patchStyle = (patch: Partial<CardStyleConfig>) => {
    if (previewing) {
      toast.error("미리보기 중입니다. 먼저 확인하거나 취소해 주세요.");
      return;
    }
    const targets = requireSelected();
    if (!targets) return;
    const bulkPatch = pickBulkStyle(patch);
    const next = { ...style, ...bulkPatch };
    setStyle(next);
    syncSelectedTemplateStyles(targets, bulkPatch);
  };

  const patchBrand = (value: string) => {
    if (previewing) {
      toast.error("미리보기 중입니다. 먼저 확인하거나 취소해 주세요.");
      return;
    }
    const targets = requireSelected();
    if (!targets) return;
    setBrand(value);
    syncSelectedTemplateDemos(targets, { brand: value || undefined });
  };

  const patchTabLabel = (value: string) => {
    if (previewing) {
      toast.error("미리보기 중입니다. 먼저 확인하거나 취소해 주세요.");
      return;
    }
    const targets = requireSelected();
    if (!targets) return;
    const patch = templateTabLabelPatch(value);
    setCategory(patch.category ?? "");
    setTab2(patch.tab2 ?? "");
    syncSelectedTemplateDemos(targets, patch);
  };

  const toggleTemplate = (id: ProductTemplate) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllTemplates = (on: boolean) => {
    setSelected(on ? new Set(ALL_TEMPLATE_IDS) : new Set());
  };

  const designateDefault = (id: ProductTemplate) => {
    setDefaultTemplate(id);
    setFocusedTemplateId(id);
    const label = PRODUCT_TEMPLATES.find((t) => t.id === id)?.label ?? id;
    toast.success(`"${label}"을(를) 대표 카드로 지정했어요.`);
  };

  const selectForPreview = (id: ProductTemplate) => {
    setFocusedTemplateId(id);
  };

  const resetTextPositions = () => {
    if (previewing) {
      toast.error("미리보기 중입니다. 먼저 확인하거나 취소해 주세요.");
      return;
    }
    patchStyle({ brandOffsetX: OFFSET_CENTER, categoryOffsetX: OFFSET_CENTER });
    toast.success("브랜드·탭2·카테고리 글씨 위치를 가운데로 초기화했어요.");
  };

  const previewItem = useMemo(
    () =>
      buildTemplateDemoItem(
        previewTemplate,
        { ...previewDemo, brand, category, tab2 },
        style
      ),
    [previewTemplate, previewDemo, brand, category, tab2, style]
  );

  const onPresetPreview = (preset: TemplatePreset) => {
    if (!previewing) {
      revertRef.current = { style: { ...style }, brand, category, tab2 };
    }
    setPreviewing(true);
    setStyle(resolveStyle(focusedTemplateId, preset.style));
    if (preset.demo?.brand != null) setBrand(preset.demo.brand);
    const presetLabel = preset.demo
      ? resolveTemplateTabLabel(focusedTemplateId, preset.demo)
      : "";
    if (presetLabel) {
      setCategory(presetLabel);
      setTab2(presetLabel);
    }
  };

  const onPresetConfirm = (preset: TemplatePreset) => {
    const targets = requireSelected();
    if (!targets) return;
    const resolved = resolveStyle(focusedTemplateId, preset.style);
    const bulkStyle = pickBulkStyle(resolved);
    const next = { ...style, ...bulkStyle };
    setStyle(next);
    syncSelectedTemplateStyles(targets, bulkStyle);
    const demoPatch: Pick<Partial<TemplateDemoData>, "brand" | "category" | "tab2"> = {};
    if (preset.demo?.brand != null) demoPatch.brand = preset.demo.brand;
    if (preset.demo) {
      const presetLabel = resolveTemplateTabLabel(focusedTemplateId, preset.demo);
      if (presetLabel) Object.assign(demoPatch, templateTabLabelPatch(presetLabel));
    }
    if (Object.keys(demoPatch).length > 0) {
      syncSelectedTemplateDemos(targets, demoPatch);
      if (demoPatch.brand != null) setBrand(demoPatch.brand);
      if (demoPatch.category != null) {
        setCategory(demoPatch.category);
        setTab2(demoPatch.tab2 ?? demoPatch.category);
      }
    }
    setPreviewing(false);
    revertRef.current = null;
  };

  const onPresetCancel = () => {
    if (revertRef.current) {
      setStyle(revertRef.current.style);
      setBrand(revertRef.current.brand);
      setCategory(revertRef.current.category);
      setTab2(revertRef.current.tab2);
    } else if (templateStyles[focusedTemplateId]) {
      setStyle(templateStyles[focusedTemplateId]);
    }
    setPreviewing(false);
    revertRef.current = null;
  };

  return (
    <div
      className={`mb-8 rounded-xl border-2 border-primary/30 bg-white shadow-sm ${
        previewing ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      <div className="border-b bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-primary" />
          <div>
            <h2 className="font-black">전체 템플릿 일괄 편집</h2>
            <p className="text-xs text-muted-foreground">
              카드를 누르면 아래에서 크게 미리보기합니다. 체크한 템플릿에만 브랜드·탭2·카테고리·스타일이 일괄 적용됩니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-paper border-b p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-muted-foreground">
            템플릿별 미리보기 — 클릭하면 아래에 표시 · 체크하면 일괄 적용 ({selectedList.length}/{ALL_TEMPLATE_IDS.length})
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => selectAllTemplates(true)}>
              전체 선택
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => selectAllTemplates(false)}>
              선택 해제
            </Button>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {PRODUCT_TEMPLATES.map((t) => {
            const checked = selected.has(t.id);
            const isDefault = defaultTemplateId === t.id;
            const isFocused = focusedTemplateId === t.id;
            const demo = templateDemos[t.id] ?? defaultDemoForTemplate(t.id);
            const cardStyle = templateStyles[t.id] ?? createDefaultStyle(t.id);
            return (
              <div
                key={t.id}
                className={`shrink-0 rounded-lg p-2 transition-colors ${
                  isFocused
                    ? "bg-blue-50 ring-2 ring-blue-500"
                    : isDefault
                    ? "bg-amber-50 ring-2 ring-amber-400"
                    : checked
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "opacity-60"
                }`}
              >
                <div className="mb-2 flex flex-col items-center gap-1">
                  <label className="flex cursor-pointer items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTemplate(t.id)}
                      className="size-3.5 accent-primary"
                    />
                    <span className="text-[10px] font-black">{t.label}</span>
                  </label>
                  {isFocused ? (
                    <span className="text-[9px] font-bold text-blue-600">▼ 아래 미리보기</span>
                  ) : null}
                  {isDefault ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-amber-950">
                      <Star className="size-2.5 fill-current" /> 대표 카드
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[9px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        designateDefault(t.id);
                      }}
                    >
                      <Star className="size-2.5" /> 기본 지정
                    </Button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => selectForPreview(t.id)}
                  className="block cursor-pointer rounded transition-opacity hover:opacity-90"
                  title={`${t.label} 아래에서 미리보기`}
                >
                  <div
                    className="origin-top"
                    style={{
                      transform: t.id === "practical" ? "scale(0.55)" : "scale(0.7)",
                      width: cardStyle.width,
                      height: cardStyle.height,
                    }}
                  >
                    <PriceCard
                      item={buildTemplateDemoItem(t.id, demo, cardStyle)}
                      styleConfig={cardStyle}
                    />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        <StickyPreviewPanel
          active
          className="-mx-4 mb-4 rounded-none border-x-0"
          label={
            <p className="text-center text-xs font-black text-blue-700">
              미리보기 — {focusedLabel}
              {isFocusedDefault ? (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-700">
                  <Star className="size-3 fill-amber-400 text-amber-400" /> (대표 카드)
                </span>
              ) : null}
            </p>
          }
        >
          <ResizablePreview
            width={style.width}
            height={style.height}
            onResize={(size) => patchStyle(size)}
          >
            <PriceCard item={previewItem} styleConfig={style} />
          </ResizablePreview>
        </StickyPreviewPanel>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-black text-muted-foreground">일괄 변경 — 브랜드 · 탭2 · 카테고리</h4>
            <div className="grid grid-cols-2 gap-3">
              <SavedNameField
                label="브랜드"
                value={brand}
                onChange={patchBrand}
                savedNames={savedBrandNames}
                trashedNames={trashedBrandNames}
                onSave={saveBrandName}
                onRemove={removeSavedBrandName}
                onRestore={restoreSavedBrandName}
                placeholder="유쏘"
                disabled={previewing}
              />
              <SavedNameField
                label="탭2 · 카테고리"
                value={tabLabel}
                onChange={patchTabLabel}
                savedNames={mergedTabLabelNames}
                trashedNames={mergedTrashedTabLabelNames}
                onSave={(name) => {
                  saveCategoryName(name);
                  saveTab2Name(name);
                }}
                onRemove={(name) => {
                  removeSavedCategoryName(name);
                  removeSavedTab2Name(name);
                }}
                onRestore={(name) => {
                  restoreSavedCategoryName(name);
                  restoreSavedTab2Name(name);
                }}
                placeholder={previewTemplate === "practical" ? "바이오" : "스킨케어"}
                selectPlaceholder="불러오기"
                disabled={previewing}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              실무용은 오른쪽 탭, 나머지 템플릿은 상단 라벨에 표시됩니다. 아래 프리셋 저장 이름과 기본으로 같게 맞춰져 있어요.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <HorizontalOffsetSlider
                label="브랜드 위치"
                previewText={brand}
                value={style.brandOffsetX ?? 50}
                onChange={(v) => patchStyle({ brandOffsetX: v })}
                disabled={previewing}
              />
              <HorizontalOffsetSlider
                label="탭2 · 카테고리 위치"
                previewText={tabLabel}
                value={style.categoryOffsetX ?? 50}
                onChange={(v) => patchStyle({ categoryOffsetX: v })}
                disabled={previewing}
              />
            </div>
            <div className="mt-2 flex justify-end">
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
          </div>

          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black text-muted-foreground">일괄 변경 — 스타일 설정</h4>
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

          {STYLE_GROUPS.map((group) => (
            <CollapsibleSection
              key={group.title}
              title={group.title}
              open={!!expanded[group.title]}
              onToggle={() => toggleSection(group.title)}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
            templateType={focusedTemplateId}
            demo={previewItem}
            currentStyle={style}
            syncTabLabel={tabLabel}
            presetManual={presetManual}
            onPresetManualChange={setPresetManual}
            showAllPresets
            showReset
            skipStoreOnConfirm
            onPreview={onPresetPreview}
            onConfirm={onPresetConfirm}
            onCancel={onPresetCancel}
            onReset={() => {
              const targets = requireSelected();
              if (!targets) return;
              if (previewing) onPresetCancel();
              resetSelectedTemplateBulkStyles(targets);
              setStyle(createDefaultStyle("basic"));
            }}
          />
        </div>
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
