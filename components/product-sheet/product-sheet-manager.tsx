"use client";



import { useMemo, useState, useEffect } from "react";

import { ProductSheetBulkEditor } from "@/components/product-sheet/product-sheet-bulk-editor";

import { ProductSheetGrid } from "@/components/product-sheet/product-sheet-grid";

import { ProductSheetIndividualSection } from "@/components/product-sheet/product-sheet-individual-section";

import { ProductSheetA4Preview } from "@/components/product-sheet/product-sheet-a4-preview";

import {

  ProductSheetExportScope,

  ProductSheetToolbar,

} from "@/components/product-sheet/product-sheet-toolbar";

import { PRODUCT_SHEET_CARD_COUNT } from "@/lib/product-sheet/initial-data";

import { resolveSelectedCards, SheetSelection } from "@/lib/product-sheet/selection";

import { SheetStyleScope, SheetStyleTarget } from "@/lib/product-sheet/brand-styles";
import { ProductSheetCardData } from "@/lib/product-sheet/types";

import {

  collectSheetBrands,

  collectSheetColors,

  filterProductSheetCards,
  sortProductSheetCards,

  ProductSheetFilters,

  useProductSheet,

} from "@/lib/product-sheet/use-product-sheet";

import { Button } from "@/components/ui/button";

import { useProductSheetExcelExport } from "@/components/product-sheet/product-sheet-excel-export";
import { printProductSheetA4 } from "@/lib/product-sheet/print-a4";

import { toast } from "sonner";
import { Copy } from "lucide-react";

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

export function ProductSheetManager() {

  const {

    cards,

    globalStyle,

    brandStyles,

    cardStyles,

    presets,

    updateCards,

    cloneCardAfter,

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

  } = useProductSheet();

  const [editBrand, setEditBrand] = useState<string | null>(null);

  const [styleScope, setStyleScope] = useState<SheetStyleScope>("global");

  const [filters, setFilters] = useState<ProductSheetFilters>({ query: "", brand: "", color: "" });

  const [selection, setSelection] = useState<SheetSelection>([]);

  const [focusId, setFocusId] = useState<string | null>(null);

  const [exportScope, setExportScope] = useState<ProductSheetExportScope>("all");

  const [exporting, setExporting] = useState(false);
  const [panelExpandTick, setPanelExpandTick] = useState(0);
  const { exportExcel, portal } = useProductSheetExcelExport();



  const filtered = useMemo(
    () => sortProductSheetCards(filterProductSheetCards(cards, filters)),
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

    const multi = e.ctrlKey || e.metaKey;



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

        total={PRODUCT_SHEET_CARD_COUNT}

        visible={filtered.length}

        selectedCount={selection.length}

        exportScope={exportScope}

        onExportScopeChange={setExportScope}

        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}

        onReset={() => {

          if (confirm("모든 카드를 초기 데이터로 되돌릴까요?")) {

            resetToInitial();

            setSelection([]);

            setFocusId(null);

            toast.success("초기 카드 목록으로 복원했어요.");

          }

        }}

        onExportExcel={handleExportExcel}

        onPrintSelected={handlePrintSelected}

        exporting={exporting}

      />



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
                <kbd className="rounded border px-1 text-[10px]">Ctrl</kbd>+클릭으로 추가 선택 ·
                카드에 마우스를 올리면 복제 버튼이 나타납니다.
                {selection.length > 0 ? (
                  <span className="ml-1 font-bold text-primary">
                    · 일괄 편집 / 선택 일괄 편집 버튼으로 이동
                  </span>
                ) : null}
              </p>

            </div>

            {selection.length > 0 ? (

              <div className="flex flex-wrap items-center gap-2">

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

                  variant="outline"

                  size="sm"

                  onClick={() => {

                    setSelection([]);

                    setFocusId(null);

                  }}

                >

                  선택 해제 ({selection.length})

                </Button>

              </div>

            ) : null}

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

