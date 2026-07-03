"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/product-sheet/product-card";
import { ResizablePreview } from "@/components/templates/resizable-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductSheetPreset } from "@/lib/product-sheet/presets";
import { SHEET_COLLAPSIBLE_SECTIONS, SHEET_STYLE_GROUPS } from "@/lib/product-sheet/style-fields";
import { PreviewFocusEditor } from "@/components/product-sheet/preview-focus-editor";
import { SheetStyleColorInput } from "@/components/product-sheet/sheet-style-color-input";
import { getSheetStyleColorFallbacks } from "@/lib/product-sheet/style-color-fallbacks";
import {
  PreviewFocus,
  fieldKeysForFocus,
  sectionForFocus,
} from "@/lib/product-sheet/preview-regions";
import { SpacingFieldKey } from "@/lib/product-sheet/spacing-fields";
import { applySheetDimensions } from "@/lib/product-sheet/scale-style";
import { hasBrandStyleOverride, hasCardStyleOverride, SheetStyleScope } from "@/lib/product-sheet/brand-styles";
import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import { ProductSheetCardData } from "@/lib/product-sheet/types";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Layers,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

function CollapsibleSection({
  title,
  open,
  onToggle,
  innerRef,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div ref={innerRef} className="rounded-md border bg-muted/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-xs font-black text-muted-foreground">{title}</span>
        {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
      </button>
      {open ? <div className="border-t px-3 pb-3 pt-2">{children}</div> : null}
    </div>
  );
}

export function ProductSheetBulkEditor({
  style,
  previewStyle,
  onStyleChange,
  onStyleReset,
  activeBrand,
  onBrandChange,
  styleScope,
  onStyleScopeChange,
  activeCardId,
  cardStyles,
  onClearCardOverride,
  brands,
  brandStyles,
  onClearBrandOverride,
  presets,
  onSavePreset,
  onApplyPreset,
  onRemovePreset,
  sampleCard,
  cards,
  panelExpandTick,
}: {
  style: ProductSheetStyleConfig;
  /** 그리드·인쇄와 동일하게 보이도록 카드에 적용할 해석된 스타일 */
  previewStyle: ProductSheetStyleConfig;
  onStyleChange: (patch: Partial<ProductSheetStyleConfig>) => void;
  onStyleReset: () => void;
  activeBrand: string | null;
  onBrandChange: (brand: string | null) => void;
  styleScope: SheetStyleScope;
  onStyleScopeChange: (scope: SheetStyleScope) => void;
  activeCardId: string | null;
  cardStyles: Record<string, ProductSheetStyleConfig>;
  onClearCardOverride?: (cardId: string) => void;
  brands: string[];
  brandStyles: Record<string, ProductSheetStyleConfig>;
  onClearBrandOverride?: (brand: string) => void;
  presets: ProductSheetPreset[];
  onSavePreset: (name: string, category: string) => void;
  onApplyPreset: (preset: ProductSheetPreset) => void;
  onRemovePreset: (id: string) => void;
  sampleCard: ProductSheetCardData;
  cards: ProductSheetCardData[];
  panelExpandTick?: number;
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "카드 크기 · 셀": true });
  const [presetName, setPresetName] = useState("");
  const [presetCategory, setPresetCategory] = useState("시트 스타일");
  const [previewFocus, setPreviewFocus] = useState<PreviewFocus | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allSectionIds = SHEET_COLLAPSIBLE_SECTIONS.map((s) => s.id);
  const allExpanded = allSectionIds.every((id) => expanded[id]);
  const toggleSection = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const previewCard = sampleCard;
  const cardStyle = previewStyle;
  const colorFallbacks = useMemo(
    () => getSheetStyleColorFallbacks(previewCard),
    [previewCard]
  );
  const highlightedKeys = useMemo(
    () => new Set(fieldKeysForFocus(previewFocus)),
    [previewFocus]
  );

  useEffect(() => {
    const section = sectionForFocus(previewFocus);
    if (!section) return;
    setExpanded((p) => ({ ...p, [section]: true }));
    requestAnimationFrame(() => {
      sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [previewFocus]);

  useEffect(() => {
    if (panelExpandTick) setPanelOpen(true);
  }, [panelExpandTick]);

  const handlePreviewBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".premium-card")) return;
    if (target.closest("[aria-label='카드 크기 조절']")) return;
    setPreviewFocus(null);
  };

  return (
    <div
      id="sheet-bulk-editor"
      className="no-print mb-6 rounded-xl border-2 border-primary/30 bg-white shadow-sm"
    >
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
      >
        <div className="flex items-center gap-2">
          <Layers className="size-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-black">일괄 편집</h2>
            <p className="text-xs text-muted-foreground">
              {styleScope === "card"
                ? "선택한 카드 1개에만 스타일이 적용됩니다."
                : activeBrand
                ? `「${activeBrand}」 브랜드 카드에만 스타일이 적용됩니다.`
                : "전체 공통 스타일 · 브랜드별 탭에서 개별 설정"}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-muted-foreground">
          {panelOpen ? (
            <>
              <ChevronUp className="size-4" /> 접기
            </>
          ) : (
            <>
              <ChevronDown className="size-4" /> 펼치기
            </>
          )}
        </span>
      </button>

      {panelOpen ? (
        <div className="grid gap-4 p-4 lg:grid-cols-[auto_1fr]">
          <div
            className="grid-paper cursor-default rounded-lg border p-4"
            onClick={handlePreviewBackgroundClick}
          >
            <p className="mb-1 text-[11px] font-bold text-muted-foreground">미리보기</p>
            <p className="mb-2 text-[10px] text-muted-foreground">
              제품명·구분선·포인트·가격을 클릭하면 우측에 수정 항목이 열립니다. 구분선·포인트는 드래그로 위치 조절.
            </p>
            <ResizablePreview
              width={cardStyle.width}
              height={cardStyle.height}
              onResize={(size) =>
                onStyleChange(applySheetDimensions(style, size.width, size.height))
              }
            >
              <ProductCard
                {...previewCard}
                styleConfig={cardStyle}
                interactive={false}
                spacingEdit
                regionEdit
                onSpacingChange={onStyleChange}
                previewFocus={previewFocus}
                onRegionSelect={(region) => setPreviewFocus({ type: "region", region })}
                onSpacingSelect={(key: SpacingFieldKey) =>
                  setPreviewFocus({ type: "spacing", key })
                }
                onAccentSelect={(target) => setPreviewFocus({ type: "accent", target })}
              />
            </ResizablePreview>
          </div>

          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            <div className="rounded-md border bg-muted/20 p-2">
              <p className="mb-2 text-[11px] font-bold text-muted-foreground">적용 범위</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onStyleScopeChange("global");
                    onBrandChange(null);
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors",
                    styleScope === "global"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:border-primary/50"
                  )}
                >
                  전체
                </button>
                {activeCardId ? (
                  <button
                    type="button"
                    onClick={() => onStyleScopeChange("card")}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors",
                      styleScope === "card"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:border-primary/50",
                      hasCardStyleOverride(activeCardId, cardStyles) &&
                        styleScope !== "card" &&
                        "border-primary/40"
                    )}
                  >
                    1개만
                    {hasCardStyleOverride(activeCardId, cardStyles) ? (
                      <span className="ml-1 text-[9px] opacity-80">●</span>
                    ) : null}
                  </button>
                ) : null}
                {brands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      onStyleScopeChange("brand");
                      onBrandChange(brand);
                    }}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors",
                      styleScope === "brand" && activeBrand === brand
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:border-primary/50",
                      hasBrandStyleOverride(brand, brandStyles) &&
                        !(styleScope === "brand" && activeBrand === brand) &&
                        "border-primary/40"
                    )}
                  >
                    {brand}
                    {hasBrandStyleOverride(brand, brandStyles) ? (
                      <span className="ml-1 text-[9px] opacity-80">●</span>
                    ) : null}
                  </button>
                ))}
              </div>
              {styleScope === "card" &&
              activeCardId &&
              hasCardStyleOverride(activeCardId, cardStyles) &&
              onClearCardOverride ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-[11px]"
                  onClick={() => {
                    onClearCardOverride(activeCardId);
                    toast.success("이 카드 전용 설정을 해제했어요.");
                  }}
                >
                  브랜드·전체 스타일로 되돌리기
                </Button>
              ) : null}
              {styleScope === "brand" &&
              activeBrand &&
              hasBrandStyleOverride(activeBrand, brandStyles) &&
              onClearBrandOverride ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-[11px]"
                  onClick={() => {
                    onClearBrandOverride(activeBrand);
                    toast.success(`「${activeBrand}」 브랜드 전용 설정을 해제했어요.`);
                  }}
                >
                  전체 스타일로 되돌리기
                </Button>
              ) : null}
            </div>

            <PreviewFocusEditor
              focus={previewFocus}
              style={style}
              onStyleChange={onStyleChange}
              colorFallbacks={colorFallbacks}
            />

            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black text-muted-foreground">
                {styleScope === "card" && activeCardId
                  ? "이 카드만 (1개)"
                  : styleScope === "brand" && activeBrand
                  ? `「${activeBrand}」 브랜드 스타일`
                  : "전체 스타일 설정"}
              </h3>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() =>
                    allExpanded
                      ? setExpanded({})
                      : setExpanded(Object.fromEntries(allSectionIds.map((id) => [id, true])))
                  }
                >
                  {allExpanded ? (
                    <>
                      <ChevronsDownUp className="size-3.5" /> 접기
                    </>
                  ) : (
                    <>
                      <ChevronsUpDown className="size-3.5" /> 펼치기
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    onStyleReset();
                    toast.success("스타일을 저장된 값으로 되돌렸어요.");
                  }}
                >
                  <RotateCcw className="size-3.5" /> 초기화
                </Button>
              </div>
            </div>

            {SHEET_STYLE_GROUPS.map((group) => (
              <CollapsibleSection
                key={group.title}
                title={group.title}
                open={!!expanded[group.title]}
                onToggle={() => toggleSection(group.title)}
                innerRef={(el) => {
                  sectionRefs.current[group.title] = el;
                }}
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.fields.map((f) => (
                    <Field key={f.key} label={f.label} highlighted={highlightedKeys.has(f.key)}>
                      {f.type === "color" ? (
                        <SheetStyleColorInput
                          fieldKey={f.key}
                          value={String(style[f.key])}
                          fallbacks={colorFallbacks}
                          onChange={(v) => onStyleChange({ [f.key]: v })}
                        />
                      ) : (
                        <Input
                          type="number"
                          value={Number(style[f.key])}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (f.key === "width") {
                              onStyleChange(applySheetDimensions(style, val, style.height));
                            } else if (f.key === "height") {
                              onStyleChange(applySheetDimensions(style, style.width, val));
                            } else {
                              onStyleChange({ [f.key]: val });
                            }
                          }}
                          className="h-9"
                        />
                      )}
                    </Field>
                  ))}
                </div>
              </CollapsibleSection>
            ))}

            <div className="rounded-md border bg-muted/20 p-3">
              <p className="mb-2 text-[11px] font-bold text-muted-foreground">스타일 저장 / 불러오기</p>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="프리셋 이름"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="h-9 min-w-[120px] flex-1"
                />
                <Input
                  placeholder="분류"
                  value={presetCategory}
                  onChange={(e) => setPresetCategory(e.target.value)}
                  className="h-9 min-w-[100px] flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const name = presetName.trim() || "시트 스타일";
                    onSavePreset(name, presetCategory);
                    toast.success(`"${name}" 스타일을 저장했어요.`);
                    setPresetName("");
                  }}
                >
                  <Save className="size-3.5" /> 저장
                </Button>
              </div>
              {presets.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px]"
                    >
                      <button
                        type="button"
                        className="font-bold hover:text-primary"
                        onClick={() => {
                          onApplyPreset(p);
                          toast.success(`"${p.name}" 스타일을 적용했어요.`);
                        }}
                      >
                        {p.name}
                      </button>
                      <span className="text-muted-foreground">({p.category})</span>
                      <button
                        type="button"
                        className="ml-1 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemovePreset(p.id)}
                        title="삭제"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-muted-foreground">저장된 스타일 프리셋이 없어요.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  highlighted,
  children,
}: {
  label: string;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(highlighted && "-m-1 rounded-md bg-primary/10 p-1")}>
      <Label className={cn("text-[11px]", highlighted && "font-black text-primary")}>{label}</Label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
