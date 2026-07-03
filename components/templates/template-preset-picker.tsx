"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { TemplatePreset, CardStyleConfig, resolveStyle } from "@/lib/template-styles";
import { resolveTemplateTabLabel } from "@/lib/template-demos";
import { ProductItem, ProductTemplate } from "@/lib/types";
import { PRODUCT_TEMPLATES } from "@/lib/templates";
import {
  collectPresetCategories,
  filterPresets,
  groupPresetsByCategoryAndBrand,
  presetBrandKey,
  presetSearchLabel,
} from "@/lib/preset-search";
import { Check, Copy, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

function templateLabel(type: ProductTemplate) {
  return PRODUCT_TEMPLATES.find((t) => t.id === type)?.label ?? type;
}

export function TemplatePresetPicker({
  templateType,
  demo,
  currentStyle,
  onPreview,
  onConfirm,
  onCancel,
  onReset,
  showReset = false,
  showAllPresets = true,
  applyToAll = false,
  skipStoreOnConfirm = false,
  className,
  syncTabLabel,
  presetManual = false,
  onPresetManualChange,
}: {
  templateType?: ProductTemplate;
  demo?: Partial<ProductItem>;
  /** 저장 시 사용할 현재 편집 중 스타일 (색상·크기 전체) */
  currentStyle?: CardStyleConfig;
  onPreview?: (preset: TemplatePreset) => void;
  onConfirm?: (preset: TemplatePreset) => void;
  onCancel?: () => void;
  onReset?: () => void;
  showReset?: boolean;
  showAllPresets?: boolean;
  applyToAll?: boolean;
  skipStoreOnConfirm?: boolean;
  className?: string;
  /** 탭2·카테고리 값 — 연동 중이면 프리셋 저장란에 자동 반영 */
  syncTabLabel?: string;
  /** 프리셋 저장란을 직접 수정했는지 (true면 탭2·카테고리 따로 편집 가능) */
  presetManual?: boolean;
  onPresetManualChange?: (manual: boolean) => void;
}) {
  const allPresets = useStore((s) => s.templatePresets);
  const { saveTemplatePreset, overwriteTemplatePreset, loadTemplatePreset, removeTemplatePreset, resetTemplateStyle, syncAllTemplateStyles } =
    useStore();

  const [presetName, setPresetName] = useState("");
  const [presetCategory, setPresetCategory] = useState("");
  const [internalPresetManual, setInternalPresetManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pending, setPending] = useState<TemplatePreset | null>(null);
  const [overwriteTarget, setOverwriteTarget] = useState<TemplatePreset | null>(null);

  const isPresetManual = onPresetManualChange ? presetManual : internalPresetManual;

  const setPresetManual = (manual: boolean) => {
    onPresetManualChange?.(manual);
    if (!onPresetManualChange) setInternalPresetManual(manual);
  };

  const tabLabelFromDemo = useMemo(() => {
    if (syncTabLabel != null && syncTabLabel !== "") return syncTabLabel.trim();
    if (!demo) return "";
    if (templateType) {
      return resolveTemplateTabLabel(templateType, {
        category: demo.category,
        tab2: demo.tab2,
      }).trim();
    }
    return (demo.tab2?.trim() || demo.category?.trim() || "");
  }, [syncTabLabel, demo, templateType]);

  const linkedPresetName = isPresetManual ? presetName : tabLabelFromDemo || presetName;
  const linkedPresetCategory = isPresetManual ? presetCategory : tabLabelFromDemo || presetCategory;

  useEffect(() => {
    if (pending || isPresetManual) return;
    if (tabLabelFromDemo) {
      setPresetName(tabLabelFromDemo);
      setPresetCategory(tabLabelFromDemo);
    }
  }, [tabLabelFromDemo, isPresetManual, pending]);

  const unlockPresetManual = () => {
    if (!isPresetManual) {
      if (tabLabelFromDemo) {
        setPresetName(tabLabelFromDemo);
        setPresetCategory(tabLabelFromDemo);
      }
      setPresetManual(true);
    }
  };

  const baseList = showAllPresets
    ? allPresets
    : templateType
    ? allPresets.filter((p) => p.templateType === templateType)
    : allPresets;

  const filteredPresets = useMemo(
    () => filterPresets(baseList, searchQuery),
    [baseList, searchQuery]
  );

  const groupedPresets = useMemo(
    () => groupPresetsByCategoryAndBrand(filteredPresets),
    [filteredPresets]
  );

  const existingCategories = useMemo(() => collectPresetCategories(allPresets), [allPresets]);
  const categoryListId = useRef(`preset-cat-${Math.random().toString(36).slice(2)}`).current;

  const resolvePresetName = () =>
    linkedPresetName.trim() || (templateType ? `${templateLabel(templateType)} 프리셋` : "저장 프리셋");

  const findOverwriteCandidate = (): TemplatePreset | undefined => {
    const name = resolvePresetName();
    const cat = linkedPresetCategory.trim();
    if (!name || !cat) return undefined;
    return allPresets.find(
      (p) =>
        p.name === name &&
        p.category === cat &&
        (!templateType || p.templateType === templateType)
    );
  };

  const validateSaveInputs = (): boolean => {
    if (!templateType) {
      toast.error("템플릿을 먼저 선택해 주세요.");
      return false;
    }
    if (pending) {
      toast.error("미리보기 중인 프리셋을 먼저 확인하거나 취소해 주세요.");
      return false;
    }
    if (!linkedPresetCategory.trim()) {
      toast.error("카테고리를 입력해 주세요.");
      return false;
    }
    return true;
  };

  const handleSaveAs = () => {
    if (!validateSaveInputs()) return;
    saveTemplatePreset(
      resolvePresetName(),
      templateType!,
      demo,
      linkedPresetCategory,
      currentStyle
    );
    toast.success(`"${resolvePresetName()}"을(를) 새 프리셋으로 저장했어요.`);
    setPresetName("");
    setPresetCategory("");
    onPresetManualChange?.(false);
    if (!onPresetManualChange) setInternalPresetManual(false);
    setOverwriteTarget(null);
  };

  const handleOverwriteRequest = () => {
    if (!validateSaveInputs()) return;
    const target = findOverwriteCandidate();
    if (!target) {
      toast.error("같은 이름·카테고리의 프리셋이 없어요. 「다른 이름으로 저장」을 사용하세요.");
      return;
    }
    setOverwriteTarget(target);
  };

  const handleOverwriteConfirm = (yes: boolean) => {
    if (!yes || !overwriteTarget || !templateType) {
      setOverwriteTarget(null);
      if (!yes) toast.info("덮어쓰기를 취소했어요.");
      return;
    }
    overwriteTemplatePreset(
      overwriteTarget.id,
      resolvePresetName(),
      templateType,
      demo,
      linkedPresetCategory,
      currentStyle
    );
    toast.success(`"${resolvePresetName()}" 프리셋을 덮어썼어요.`);
    setOverwriteTarget(null);
  };

  const startPreview = (presetId: string) => {
    const preset = allPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setPresetName(preset.name);
    setPresetCategory(preset.category);
    onPresetManualChange?.(true);
    if (!onPresetManualChange) setInternalPresetManual(true);
    setOverwriteTarget(null);
    setPending(preset);
    onPreview?.(preset);
    toast.message(`"${preset.name}" 미리보기 — 확인 후 적용하세요.`);
  };

  const handleConfirm = () => {
    if (!pending) return;
    if (!skipStoreOnConfirm) {
      if (applyToAll) {
        syncAllTemplateStyles(pending.style);
      } else {
        loadTemplatePreset(pending.id);
      }
    }
    onConfirm?.(pending);
    setPending(null);
    toast.success(`"${pending.name}" 변경 내용을 확정했어요.`);
  };

  const handleCancel = () => {
    onCancel?.();
    setPending(null);
    onPresetManualChange?.(false);
    if (!onPresetManualChange) setInternalPresetManual(false);
    toast.info("불러오기를 취소했어요.");
  };

  return (
    <div className={className ?? "rounded-md border bg-muted/30 p-3"}>
      <h4 className="mb-1 text-xs font-black">저장 / 불러오기</h4>
      <p className="mb-2 text-[11px] text-muted-foreground">
        「저장」은 같은 이름·카테고리 프리셋을 덮어씁니다. 「다른 이름으로 저장」은 새 프리셋을 만듭니다.
      </p>

      {pending ? (
        <div className="mb-3 rounded-lg border-2 border-primary bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black text-primary">미리보기 중</p>
              <p className="mt-0.5 text-xs font-bold">{pending.name}</p>
              <p className="text-[11px] text-muted-foreground">
                [{pending.category}] · {templateLabel(pending.templateType)}
              </p>
              {presetSearchLabel(pending) ? (
                <p className="text-[11px] text-muted-foreground">{presetSearchLabel(pending)}</p>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                브랜드 위치 {pending.style.brandOffsetX ?? 50}% · 카테고리 위치{" "}
                {pending.style.categoryOffsetX ?? 50}%
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleConfirm}>
              <Check className="size-3.5" /> 확인 · 적용
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
              <X className="size-3.5" /> 취소
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                removeTemplatePreset(pending.id);
                handleCancel();
                toast.success("프리셋을 삭제했어요.");
              }}
            >
              <Trash2 className="size-3.5" /> 삭제
            </Button>
          </div>
        </div>
      ) : null}

      {templateType ? (
        <div className="mb-3 space-y-2 rounded-md border bg-background p-2">
          <p className="text-[11px] font-bold text-muted-foreground">프리셋 저장</p>
          {!isPresetManual ? (
            <p className="text-[10px] text-muted-foreground">
              위 탭2·카테고리와 같게 맞춰져 있어요. 이름을 바꾸면 탭2·카테고리를 따로 수정할 수 있어요.
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              프리셋 저장 이름을 직접 수정 중이에요. 위 탭2·카테고리도 따로 바꿀 수 있어요.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <div className="min-w-[120px] flex-1">
              <Input
                list={categoryListId}
                placeholder="카테고리 (예: 스킨케어, 유쏘)"
                value={linkedPresetCategory}
                onChange={(e) => {
                  unlockPresetManual();
                  setPresetCategory(e.target.value);
                  setOverwriteTarget(null);
                }}
                disabled={!!pending}
                className="h-9"
              />
              <datalist id={categoryListId}>
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <Input
              placeholder="프리셋 이름"
              value={linkedPresetName}
              onChange={(e) => {
                unlockPresetManual();
                setPresetName(e.target.value);
                setOverwriteTarget(null);
              }}
              className="h-9 min-w-[120px] flex-1"
              disabled={!!pending}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleOverwriteRequest}
              disabled={!!pending || !!overwriteTarget}
            >
              <Save className="size-3.5" /> 저장
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSaveAs}
              disabled={!!pending || !!overwriteTarget}
            >
              <Copy className="size-3.5" /> 다른 이름으로 저장
            </Button>
          </div>

          {overwriteTarget ? (
            <div className="rounded-md border-2 border-amber-400 bg-amber-50 p-2.5">
              <p className="text-xs font-bold text-amber-950">
                「{overwriteTarget.name}」({overwriteTarget.category}) 프리셋을 덮어씌울까요?
              </p>
              <p className="mt-0.5 text-[11px] text-amber-900/80">
                현재 크기·색상·문구로 기존 프리셋이 바뀝니다.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => handleOverwriteConfirm(true)}>
                  예, 덮어쓰기
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => handleOverwriteConfirm(false)}>
                  아니요
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="상품명 · 브랜드 · 카테고리 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8"
            disabled={!!pending}
          />
        </div>
        <Select
          value=""
          onChange={(e) => e.target.value && startPreview(e.target.value)}
          className="h-9 min-w-[140px] max-w-[220px]"
          disabled={!!pending || filteredPresets.length === 0}
        >
          <option value="">불러오기…</option>
          {groupedPresets.flatMap((g) =>
            g.brands.map((b) => (
              <optgroup key={presetBrandKey(g.category, b.brand)} label={`${g.category} · ${b.brand}`}>
                {b.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {presetSearchLabel(p) ? ` · ${presetSearchLabel(p)}` : ""}
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </Select>
        {showReset && templateType && onReset ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!!pending}
            onClick={() => {
              if (applyToAll) {
                useStore.getState().resetAllTemplateStyles();
              } else if (templateType) {
                resetTemplateStyle(templateType);
              }
              onReset();
              toast.success("기본값으로 초기화했어요.");
            }}
          >
            <RotateCcw className="size-3.5" /> 초기화
          </Button>
        ) : null}
      </div>

      {baseList.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">저장된 프리셋이 없어요.</p>
      ) : filteredPresets.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">검색 결과가 없어요.</p>
      ) : null}
    </div>
  );
}

/** 프리셋 미리보기 시 상품 입력 폼에 반영 */
export function applyPresetToProductForm(
  preset: TemplatePreset,
  setters: {
    setTemplate: (t: ProductTemplate) => void;
    setColor: (c: string) => void;
    setField: (key: string, value: string) => void;
  }
) {
  setters.setTemplate(preset.templateType);
  setters.setColor(resolveStyle(preset.templateType, preset.style).accentColor);
  const d = preset.demo;
  if (!d) return;
  if (d.brand != null) setters.setField("brand", d.brand);
  if (d.category != null) setters.setField("category", d.category);
  if (d.tab2 != null) setters.setField("tab2", d.tab2);
  if (d.name) setters.setField("name", d.name);
  if (d.volume) setters.setField("volume", d.volume);
  if (d.price != null) setters.setField("price", String(d.price));
  if (d.subtitle) setters.setField("subtitle", d.subtitle);
  if (d.eventText) setters.setField("eventText", d.eventText);
  if (d.tags?.length) setters.setField("tags", d.tags.map((t) => `#${t}`).join(" "));
  if (d.highlightWords?.length) setters.setField("highlight", d.highlightWords.join(", "));
}

/** 폼 스냅샷 저장·복원 (프리셋 취소용) */
export function useFormSnapshot<T>() {
  const ref = useRef<T | null>(null);
  return {
    save: (v: T) => {
      ref.current = v;
    },
    restore: (): T | null => ref.current,
    clear: () => {
      ref.current = null;
    },
  };
}
