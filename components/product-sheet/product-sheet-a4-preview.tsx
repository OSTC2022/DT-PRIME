"use client";

import { ProductCard } from "@/components/product-sheet/product-card";
import { Button } from "@/components/ui/button";
import {
  A4_GAP_MM,
  A4_HEIGHT_MM,
  A4_MARGIN_MM,
  A4_WIDTH_MM,
  a4ContentAreaMm,
  a4PreviewScale,
  a4SizePx,
  A4PagePlan,
  computeA4Grid,
  planA4Pages,
} from "@/lib/product-sheet/a4-layout";
import { printProductSheetA4 } from "@/lib/product-sheet/print-a4";
import { resolveSheetCardStyle } from "@/lib/product-sheet/brand-styles";
import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import { ProductSheetCardData } from "@/lib/product-sheet/types";
import { Printer } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

function A4PageContent({
  pagePlan,
  globalStyle,
  brandStyles,
  cardStyles = {},
}: {
  pagePlan: A4PagePlan<ProductSheetCardData>;
  globalStyle: ProductSheetStyleConfig;
  brandStyles: Record<string, ProductSheetStyleConfig>;
  cardStyles?: Record<string, ProductSheetStyleConfig>;
}) {
  const { widthMm: contentWmm } = a4ContentAreaMm();

  return (
    <div
      className="a4-page-content"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `${A4_GAP_MM}mm`,
        width: `${contentWmm}mm`,
        maxHeight: `${a4ContentAreaMm().heightMm}mm`,
        overflow: "hidden",
        alignContent: "flex-start",
      }}
    >
      {pagePlan.rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="a4-page-row"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: `${A4_GAP_MM}mm`,
            height: `${row.heightMm}mm`,
            flexShrink: 0,
          }}
        >
          {row.items.map((card, idx) => {
            const style = resolveSheetCardStyle(card, globalStyle, brandStyles, cardStyles);
            return (
              <ProductCard
                key={`${card.id}-${rowIdx}-${idx}`}
                {...card}
                styleConfig={style}
                interactive={false}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function A4PageShell({
  pagePlan,
  pageNumber,
  totalPages,
  globalStyle,
  brandStyles,
  cardStyles = {},
  className,
}: {
  pagePlan: A4PagePlan<ProductSheetCardData>;
  pageNumber: number;
  totalPages: number;
  globalStyle: ProductSheetStyleConfig;
  brandStyles: Record<string, ProductSheetStyleConfig>;
  cardStyles?: Record<string, ProductSheetStyleConfig>;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width: `${A4_WIDTH_MM}mm`,
        height: `${A4_HEIGHT_MM}mm`,
        padding: `${A4_MARGIN_MM}mm`,
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <A4PageContent
        pagePlan={pagePlan}
        globalStyle={globalStyle}
        brandStyles={brandStyles}
        cardStyles={cardStyles}
      />
      {totalPages > 1 ? (
        <p
          className="pointer-events-none text-center text-[9px] text-neutral-400"
          style={{
            position: "absolute",
            bottom: "2mm",
            left: 0,
            right: 0,
            margin: 0,
          }}
        >
          {pageNumber} / {totalPages}
        </p>
      ) : null}
    </div>
  );
}

export function ProductSheetA4Preview({
  cards,
  globalStyle,
  brandStyles,
  cardStyles = {},
}: {
  cards: ProductSheetCardData[];
  globalStyle: ProductSheetStyleConfig;
  brandStyles: Record<string, ProductSheetStyleConfig>;
  cardStyles?: Record<string, ProductSheetStyleConfig>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pagePlans = useMemo(
    () =>
      planA4Pages(cards, (card) => {
        const style = resolveSheetCardStyle(card, globalStyle, brandStyles, cardStyles);
        return { widthPx: style.width, heightPx: style.height };
      }),
    [cards, globalStyle, brandStyles, cardStyles]
  );

  const gridHint = useMemo(
    () => computeA4Grid(globalStyle.width, globalStyle.height),
    [globalStyle.width, globalStyle.height]
  );

  const scale = a4PreviewScale(280);
  const a4Px = a4SizePx();

  if (cards.length === 0) {
    return (
      <aside className="rounded-lg border border-dashed bg-muted/20 p-4 text-center">
        <p className="text-sm font-bold text-muted-foreground">A4 인쇄 미리보기</p>
        <p className="mt-2 text-xs text-muted-foreground">
          그리드에서 카드를 클릭해 선택하면
          <br />
          왼쪽에 A4 배치 미리보기가 나타납니다.
        </p>
      </aside>
    );
  }

  return (
    <aside ref={panelRef} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black">A4 인쇄 미리보기</h3>
          <p className="text-[10px] text-muted-foreground">
            최대 {gridHint.cols}열 · 카드 간격 {A4_GAP_MM}mm · {pagePlans.length}페이지 ·{" "}
            {cards.length}개 카드
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => printProductSheetA4()}>
          <Printer className="size-3.5" />
          선택 인쇄
        </Button>
      </div>

      <div className="flex flex-col items-center gap-4 overflow-y-auto rounded-lg border bg-neutral-100/80 p-3 max-h-[calc(100vh-10rem)]">
        {pagePlans.map((pagePlan, i) => (
          <div
            key={i}
            className="shadow-md ring-1 ring-black/10"
            style={{
              width: a4Px.width * scale,
              height: a4Px.height * scale,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <A4PageShell
                pagePlan={pagePlan}
                pageNumber={i + 1}
                totalPages={pagePlans.length}
                globalStyle={globalStyle}
                brandStyles={brandStyles}
                cardStyles={cardStyles}
                className="a4-preview-page shadow-none"
              />
            </div>
          </div>
        ))}
      </div>

      {mounted && pagePlans.length > 0
        ? createPortal(
            <div className="sheet-a4-print-target" aria-hidden>
              {pagePlans.map((pagePlan, i) => (
                <A4PageShell
                  key={i}
                  pagePlan={pagePlan}
                  pageNumber={i + 1}
                  totalPages={pagePlans.length}
                  globalStyle={globalStyle}
                  brandStyles={brandStyles}
                  cardStyles={cardStyles}
                  className="a4-print-page"
                />
              ))}
            </div>,
            document.body
          )
        : null}
    </aside>
  );
}
