"use client";



import { useCallback, useMemo, useState, useEffect } from "react";

import { ProductSheetBulkEditor } from "@/components/product-sheet/product-sheet-bulk-editor";

import { ProductSheetGrid } from "@/components/product-sheet/product-sheet-grid";

import { ProductSheetIndividualSection } from "@/components/product-sheet/product-sheet-individual-section";

import { ProductSheetA4Preview } from "@/components/product-sheet/product-sheet-a4-preview";

import {

  ProductSheetExportScope,

  ProductSheetToolbar,

} from "@/components/product-sheet/product-sheet-toolbar";

import { resolveSelectedCards, SheetSelection } from "@/lib/product-sheet/selection";

import { SheetStyleScope, SheetStyleTarget } from "@/lib/product-sheet/brand-styles";
import { ProductSheetCardData } from "@/lib/product-sheet/types";

import {

  collectSheetBrands,

  collectSheetColors,

  filterProductSheetCards,

  ProductSheetFilters,

  useProductSheet,

} from "@/lib/product-sheet/use-product-sheet";

import { Button } from "@/components/ui/button";

import { useProductSheetExcelExport } from "@/components/product-sheet/product-sheet-excel-export";
import { printProductSheetA4 } from "@/lib/product-sheet/print-a4";
import {
  exportProductCardTemplateBackup,
  downloadProductCardTemplateBackup,
  importProductCardTemplateBackup,
  ImportBackupError,
  loadProductSheetUiState,
} from "@/lib/product-sheet/sheet-backup";
import { hasCurrentVersionStorage, saveBaselineFromScreen } from "@/lib/product-sheet/sheet-storage";
import { uploadCloudBackup } from "@/lib/product-sheet/sheet-cloud-client";
import { setSyncMeta } from "@/lib/product-sheet/sheet-cloud-sync";
import { useCloudSheetSync } from "@/lib/product-sheet/use-cloud-sheet-sync";

import { toast } from "sonner";
import { Copy, MousePointerClick, Trash2 } from "lucide-react";

function sheetCardSummary(card: ProductSheetCardData) {
  return [card.brand, card.title, card.highlight].filter(Boolean).join(" · ");
}

function SheetEditPanelNav({
  cards,
  selection,
}: {
  cards: ProductSheetCardData[];
  selection: SheetSelection;
}) {
  const uniqueSelected = useMemo(() => {
    const seen = new Set<string>();
    return resolveSelectedCards(cards, selection).filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [cards, selection]);

  const summary =
    uniqueSelected.length === 1
      ? sheetCardSummary(uniqueSelected[0]!)
      : `${uniqueSelected.length}개 카드 선택`;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      id="sheet-edit-panel-nav"
      className="no-print mb-3 flex flex-wrap items-center gap-2 rounded-lg border-2 border-primary/40 bg-primary/5 px-3 py-2.5"
    >
      <span className="text-[11px] font-black text-muted-foreground">편집 이동</span>
      <Button
        type="button"
        variant="default"
        size="sm"
        className="h-8 text-xs"
        onClick={() => scrollTo("sheet-bulk-editor")}
      >
        일괄 편집
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-8 text-xs"
        onClick={() => scrollTo("sheet-selected-batch-editor")}
      >
        선택 일괄 편집
      </Button>
      <span className="ml-auto text-[11px] text-muted-foreground">{summary}</span>
    </div>
  );
}

function readInitialUiState() {
  if (typeof window === "undefined") return null;
  return loadProductSheetUiState();
}

export function ProductSheetManager() {

  const {

    cards,

    globalStyle,

    brandStyles,

    cardStyles,

    presets,

    updateCards,

    cloneCardAfter,

    deleteCards,

    updateStyleForTarget,

    resetStyleForTarget,

    clearBrandStyleOverride,

    clearCardStyleOverride,

    resolveBrandStyle,

    resolveCardStyle,

    savePreset,

    removePreset,

    applyPreset,

    resetToInitial,

    clearSavedData,

  } = useProductSheet();

  useCloudSheetSync();

  const savedUi = readInitialUiState();

  const [editBrand, setEditBrand] = useState<string | null>(null);

  const [styleScope, setStyleScope] = useState<SheetStyleScope>("global");

  const [filters, setFilters] = useState<ProductSheetFilters>(
    () => savedUi?.filters ?? { query: "", brand: "", color: "" }
  );

  const [selection, setSelection] = useState<SheetSelection>(() => savedUi?.selection ?? []);

  const [focusId, setFocusId] = useState<string | null>(null);

  const [exportScope, setExportScope] = useState<ProductSheetExportScope>(
    () => savedUi?.exportScope ?? "all"
  );

  const [exporting, setExporting] = useState(false);
  const [panelExpandTick, setPanelExpandTick] = useState(0);
  const [multiSelectMode, setMultiSelectMode] = useState(() => savedUi?.multiSelectMode ?? false);
  const { exportExcel, portal } = useProductSheetExcelExport();

  const [usingSavedData, setUsingSavedData] = useState(false);

  useEffect(() => {
    setUsingSavedData(hasCurrentVersionStorage());
  }, []);

  const handleExportBackup = useCallback(() => {
    const backup = exportProductCardTemplateBackup({
      state: { cards, globalStyle, brandStyles, cardStyles, presets },
      ui: { filters, selection, exportScope, multiSelectMode },
    });
    downloadProductCardTemplateBackup(backup);
    toast.success(`저장 데이터 ${backup.data.cards.length}개 카드를 JSON으로 보냈어요.`);
  }, [cards, globalStyle, brandStyles, cardStyles, presets, filters, selection, exportScope, multiSelectMode]);

  const handleImportBackup = useCallback(async (file: File) => {
    if (!confirm("기존 브라우저 저장 데이터를 덮어쓸까요?")) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text.trim().replace(/^\uFEFF/, ""));
      importProductCardTemplateBackup(text);
      const cloud = await uploadCloudBackup(parsed);
      if (cloud.ok) {
        toast.success("가져오기 완료. 클라우드에도 반영했어요.");
      } else {
        toast.success("가져오기 완료 (클라우드 미연결)");
      }
      window.location.reload();
    } catch (error) {
      if (error instanceof ImportBackupError) {
        if (error.code === "parse") {
          toast.error("JSON 파일 형식이 올바르지 않습니다.");
          return;
        }
        toast.error(error.message);
        return;
      }
      console.error("[product-card-template import] unexpected error:", error);
      toast.error("가져오기에 실패했습니다.");
    }
  }, []);

  const handleSaveWithUi = useCallback(async () => {
    const backup = exportProductCardTemplateBackup({
      state: { cards, globalStyle, brandStyles, cardStyles, presets },
      ui: { filters, selection, exportScope, multiSelectMode },
      source: "explicit-save",
    });
    setSyncMeta(backup.exportedAt);
    setUsingSavedData(true);
    saveBaselineFromScreen(
      { cards, globalStyle, brandStyles, cardStyles, presets },
      { filters, selection, exportScope, multiSelectMode }
    );

    const cloud = await uploadCloudBackup(backup);
    if (cloud.ok) {
      toast.success("저장했어요. 초기화 시 이 화면 그대로 돌아옵니다.");
      return;
    }
    if (!cloud.configured) {
      toast.success("브라우저에 저장했어요. 초기화 시 이 화면 그대로 돌아옵니다.");
      return;
    }
    toast.warning(`브라우저에는 저장됐지만 클라우드 동기화 실패: ${cloud.message}`);
  }, [cards, globalStyle, brandStyles, cardStyles, presets, filters, selection, exportScope, multiSelectMode]);



  const filtered = useMemo(
    () => filterProductSheetCards(cards, filters),
    [cards, filters]
  );

  const brands = useMemo(() => collectSheetBrands(cards), [cards]);

  const colors = useMemo(() => collectSheetColors(cards), [cards]);

  const sampleCard = useMemo(() => {
    if (focusId) {
      const focused = cards.find((c) => c.id === focusId);
      if (focused) return focused;
    }
    if (editBrand) {
      return cards.find((c) => c.brand === editBrand) ?? cards[0] ?? filtered[0];
    }
    return cards[0] ?? filtered[0];
  }, [cards, filtered, editBrand, focusId]);

  const styleTarget = useMemo((): SheetStyleTarget => {
    if (styleScope === "card" && focusId && sampleCard) {
      return { scope: "card", cardId: focusId, brand: sampleCard.brand };
    }
    if (styleScope === "brand" && editBrand) {
      return { scope: "brand", brand: editBrand };
    }
    return { scope: "global" };
  }, [styleScope, focusId, editBrand, sampleCard]);

  const editingStyle = useMemo(() => {
    if (styleTarget.scope === "card") {
      const card =
        cards.find((c) => c.id === styleTarget.cardId) ??
        (sampleCard?.id === styleTarget.cardId ? sampleCard : null);
      return resolveCardStyle(
        card ?? { id: styleTarget.cardId, brand: styleTarget.brand }
      );
    }
    if (styleTarget.scope === "brand") {
      return resolveBrandStyle(styleTarget.brand);
    }
    return globalStyle;
  }, [styleTarget, globalStyle, resolveBrandStyle, resolveCardStyle, cards, sampleCard]);

  const previewStyle = useMemo(() => {
    if (!sampleCard) return editingStyle;
    return resolveCardStyle(sampleCard);
  }, [sampleCard, editingStyle, resolveCardStyle]);



  const selectedCards = useMemo(

    () => resolveSelectedCards(cards, selection),

    [cards, selection]

  );



  useEffect(() => {

    setExportScope(selection.length > 0 ? "selected" : "all");

  }, [selection.length]);



  const handlePrintSelected = () => {

    if (selection.length === 0) {

      toast.error("인쇄할 카드를 그리드에서 선택해 주세요.");

      return;

    }

    printProductSheetA4();

    toast.success(`선택한 ${selection.length}개 카드를 A4로 인쇄합니다.`);

  };



  const handleGridCardClick = (card: ProductSheetCardData, e: React.MouseEvent) => {

    const multi = multiSelectMode || e.ctrlKey || e.metaKey;



    setSelection((prev) => (multi ? [...prev, card.id] : [card.id]));
    setFocusId(card.id);
    setEditBrand(card.brand);
    setStyleScope("card");
    setPanelExpandTick((t) => t + 1);

    if (!multi) {
      requestAnimationFrame(() => {
        document.getElementById("sheet-edit-panel-nav")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };



  const handleCardClone = (card: ProductSheetCardData) => {
    const newId = cloneCardAfter(card.id);
    if (!newId) {
      toast.error("카드 복제에 실패했어요.");
      return;
    }

    setSelection([newId]);
    setFocusId(newId);
    setEditBrand(card.brand);
    setStyleScope("card");
    setPanelExpandTick((t) => t + 1);
    toast.success(`「${card.title}」 카드를 복제했어요.`);
  };

  const uniqueSelectionCount = useMemo(() => new Set(selection).size, [selection]);

  const handleDeleteSelected = () => {
    const uniqueIds = Array.from(new Set(selection));
    if (uniqueIds.length === 0) {
      toast.error("삭제할 카드를 그리드에서 선택해 주세요.");
      return;
    }

    if (!confirm(`선택한 ${uniqueIds.length}개 카드를 삭제할까요?`)) return;

    deleteCards(uniqueIds);
    setSelection([]);
    setFocusId(null);
    toast.success(`${uniqueIds.length}개 카드를 삭제했어요.`);
  };



  const handleExportExcel = async () => {

    if (exportScope === "selected" && selection.length === 0) {

      toast.error("다운로드할 카드를 그리드에서 선택해 주세요.");

      return;

    }

    if (cards.length === 0) return;



    setExporting(true);
    try {
      const list =
        exportScope === "selected" ? selectedCards : cards;
      const selectedOnly = exportScope === "selected";
      await exportExcel(list, globalStyle, brandStyles, cardStyles, selectedOnly);
      toast.success(
        selectedOnly
          ? `선택한 ${list.length}개 카드를 이미지로 엑셀 다운로드했어요.`
          : `전체 ${list.length}개 카드를 이미지로 엑셀 다운로드했어요.`
      );
    } catch {
      toast.error("엑셀 다운로드에 실패했어요.");
    } finally {
      setExporting(false);
    }
  };



  return (

    <div>

      {sampleCard ? (

        <ProductSheetBulkEditor

          style={editingStyle}

          previewStyle={previewStyle}

          onStyleChange={(patch) => updateStyleForTarget(styleTarget, patch)}

          onStyleReset={() => resetStyleForTarget(styleTarget)}

          activeBrand={editBrand}

          onBrandChange={setEditBrand}

          styleScope={styleScope}

          onStyleScopeChange={setStyleScope}

          activeCardId={focusId}

          cardStyles={cardStyles}

          onClearCardOverride={clearCardStyleOverride}

          brands={brands}

          brandStyles={brandStyles}

          onClearBrandOverride={clearBrandStyleOverride}

          presets={presets}

          onSavePreset={(name, category) => savePreset(name, category, styleTarget)}

          onApplyPreset={(preset) => applyPreset(preset, styleTarget)}

          onRemovePreset={removePreset}

          sampleCard={sampleCard}

          cards={cards}

          panelExpandTick={panelExpandTick}

        />

      ) : null}



      <ProductSheetIndividualSection

        cards={cards}

        globalStyle={globalStyle}

        resolveCardStyle={resolveCardStyle}

        selection={selection}

        onSelectionChange={setSelection}

        onFocusIdChange={setFocusId}

        updateCards={updateCards}

        panelExpandTick={panelExpandTick}

      />



      <ProductSheetToolbar

        filters={filters}

        brands={brands}

        colors={colors}

        total={cards.length}

        visible={filtered.length}

        selectedCount={selection.length}

        exportScope={exportScope}

        onExportScopeChange={setExportScope}

        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}

        onSave={handleSaveWithUi}

        onExportBackup={handleExportBackup}

        onImportBackup={handleImportBackup}

        onResetToDefaults={() => {

          if (
            confirm(
              "마지막으로 「저장」한 화면(글씨·카드 크기 포함)으로 되돌릴까요?\n\n저장한 적이 없으면 코드 기본값이 적용됩니다."
            )
          ) {

            resetToInitial();

            setFilters({ query: "", brand: "", color: "" });

            setSelection([]);

            setFocusId(null);

            setExportScope("all");

            setMultiSelectMode(false);

            toast.success("최신 기본값으로 초기화했어요.");

          }

        }}

        onClearSaved={() => {

          if (
            confirm(
              "브라우저에 저장된 제품 카드 데이터를 삭제할까요?\n\n삭제 후에는 코드 기본값이 표시됩니다."
            )
          ) {

            clearSavedData();

            toast.success("저장 데이터를 삭제했어요. 페이지를 새로고침합니다.");

            window.location.reload();

          }

        }}

        onExportExcel={handleExportExcel}

        onPrintSelected={handlePrintSelected}

        exporting={exporting}

      />

      <p className="no-print -mt-2 mb-4 text-[10px] text-muted-foreground">
        {usingSavedData ?
          "현재 브라우저에 저장된 사용자 데이터를 표시 중입니다."
        : "저장 데이터 없음 — 코드에 포함된 최신 기본값을 표시 중입니다."}
      </p>



      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

        <div className="no-print w-full shrink-0 lg:sticky lg:top-4 lg:w-[300px]">

          <ProductSheetA4Preview
            cards={selectedCards}
            globalStyle={globalStyle}
            brandStyles={brandStyles}
            cardStyles={cardStyles}
          />

        </div>



        <div className="min-w-0 flex-1">

          {selection.length > 0 ? <SheetEditPanelNav cards={cards} selection={selection} /> : null}

          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">

            <div>

              <h2 className="font-black">제품 카드 그리드</h2>

              <p className="text-xs text-muted-foreground">

                클릭하면 단일 선택 ·{" "}
                <kbd className="rounded border px-1 text-[10px]">Ctrl</kbd>+클릭 또는{" "}
                <span className="font-semibold">카드 선택</span> 버튼으로 추가 선택 ·
                카드에 마우스를 올리면 복제 버튼이 나타납니다.
                {selection.length > 0 ? (
                  <span className="ml-1 font-bold text-primary">
                    · 일괄 편집 / 선택 일괄 편집 버튼으로 이동
                  </span>
                ) : null}
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <Button
                type="button"
                variant={multiSelectMode ? "default" : "outline"}
                size="sm"
                onClick={() => setMultiSelectMode((v) => !v)}
                title="Ctrl+클릭과 같이 카드를 누적 선택합니다"
              >
                <MousePointerClick className="mr-1.5 size-3.5" />
                카드 선택{multiSelectMode ? " (켜짐)" : ""}
              </Button>

              {selection.length > 0 ? (
                <>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const sourceId = focusId ?? selection[selection.length - 1];
                      const source = cards.find((c) => c.id === sourceId);
                      if (source) handleCardClone(source);
                    }}
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    카드 복제
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    선택 삭제 ({uniqueSelectionCount})
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelection([]);
                      setFocusId(null);
                    }}
                  >
                    선택 해제 ({selection.length})
                  </Button>
                </>
              ) : null}

            </div>

          </div>



          {filtered.length === 0 ? (

            <p className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">

              검색·필터 조건에 맞는 카드가 없어요.

            </p>

          ) : (

            <ProductSheetGrid

              cards={filtered}

              globalStyle={globalStyle}

              brandStyles={brandStyles}

              cardStyles={cardStyles}

              onCardClick={handleGridCardClick}

              onCardClone={handleCardClone}

              onBackgroundClick={() => {

                setSelection([]);

                setFocusId(null);

              }}

              selection={selection}

            />

          )}

        </div>

      </div>

      {portal}

    </div>

  );

}

