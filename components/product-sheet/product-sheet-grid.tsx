"use client";

import { ProductCard } from "@/components/product-sheet/product-card";
import { resolveSheetCardStyle } from "@/lib/product-sheet/brand-styles";
import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import { ProductSheetCardData } from "@/lib/product-sheet/types";
import { selectionIncludes, SheetSelection } from "@/lib/product-sheet/selection";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";

export function ProductSheetGrid({
  cards,
  globalStyle,
  brandStyles,
  cardStyles = {},
  onCardClick,
  onCardClone,
  onBackgroundClick,
  selection,
}: {
  cards: ProductSheetCardData[];
  globalStyle: ProductSheetStyleConfig;
  brandStyles: Record<string, ProductSheetStyleConfig>;
  cardStyles?: Record<string, ProductSheetStyleConfig>;
  onCardClick: (card: ProductSheetCardData, e: React.MouseEvent) => void;
  onCardClone?: (card: ProductSheetCardData) => void;
  onBackgroundClick?: () => void;
  selection: SheetSelection;
}) {
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onBackgroundClick) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-sheet-card]")) return;
    onBackgroundClick();
  };

  return (
    <div className="product-sheet-scroll pb-4">
      <div
        className="grid-paper cursor-default rounded-xl border p-5"
        onClick={handleBackgroundClick}
      >
        <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {cards.map((card) => (
            <div key={card.id} className="group relative flex justify-center">
              {onCardClone ? (
                <button
                  type="button"
                  title="카드 복제"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardClone(card);
                  }}
                  className="no-print absolute right-0 top-0 z-10 flex size-7 items-center justify-center rounded-md border bg-white/95 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:border-primary hover:text-primary group-hover:opacity-100"
                >
                  <Copy className="size-3.5" />
                </button>
              ) : null}
              <ProductCard
                {...card}
                styleConfig={resolveSheetCardStyle(card, globalStyle, brandStyles, cardStyles)}
                onClick={(e) => onCardClick(card, e)}
                className={cn(
                  "transition-transform duration-200 hover:-translate-y-0.5",
                  selectionIncludes(selection, card.id) && "ring-2 ring-primary ring-offset-2"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
