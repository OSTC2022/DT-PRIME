"use client";

import { ProductCard } from "@/components/product-sheet/product-card";
import { resolveSheetCardStyle } from "@/lib/product-sheet/brand-styles";
import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import {
  buildProductSheetExcelBuffer,
  buildSheetExportFilename,
  SheetCardCapture,
} from "@/lib/product-sheet/export-excel";
import { ProductSheetCardData } from "@/lib/product-sheet/types";
import { saveAs } from "file-saver";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ExportRequest = {
  cards: ProductSheetCardData[];
  globalStyle: ProductSheetStyleConfig;
  brandStyles: Record<string, ProductSheetStyleConfig>;
  cardStyles: Record<string, ProductSheetStyleConfig>;
  selectedOnly: boolean;
  resolve: () => void;
  reject: (error: unknown) => void;
};

async function waitForContainer(
  ref: React.RefObject<HTMLDivElement | null>,
  count: number
): Promise<HTMLElement> {
  for (let i = 0; i < 40; i++) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    const el = ref.current;
    if (el && el.querySelectorAll("[data-export-card]").length === count) return el;
  }
  throw new Error("export-container-missing");
}

async function captureCards(container: HTMLElement): Promise<SheetCardCapture[]> {
  const { toPng } = await import("html-to-image");
  const nodes = Array.from(container.querySelectorAll<HTMLElement>("[data-export-card]"));
  const captures: SheetCardCapture[] = [];

  for (const el of nodes) {
    const id = el.dataset.exportCard;
    if (!id) continue;
    const rect = el.getBoundingClientRect();
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
    captures.push({
      id,
      dataUrl,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }
  return captures;
}

export function useProductSheetExcelExport() {
  const [request, setRequest] = useState<ExportRequest | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const exportExcel = useCallback(
    (
      cards: ProductSheetCardData[],
      globalStyle: ProductSheetStyleConfig,
      brandStyles: Record<string, ProductSheetStyleConfig>,
      cardStyles: Record<string, ProductSheetStyleConfig>,
      selectedOnly: boolean
    ) =>
      new Promise<void>((resolve, reject) => {
        if (cards.length === 0) {
          reject(new Error("empty"));
          return;
        }
        setRequest({ cards, globalStyle, brandStyles, cardStyles, selectedOnly, resolve, reject });
      }),
    []
  );

  useEffect(() => {
    if (!request) return;
    let cancelled = false;

    (async () => {
      try {
        await document.fonts.ready;
        const container = await waitForContainer(containerRef, request.cards.length);
        if (cancelled) return;
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

        const captures = await captureCards(container);
        if (captures.length === 0) throw new Error("capture-failed");

        const ordered = request.cards.map((card, i) => {
          const cap =
            captures.find((c) => c.id === `${card.id}-${i}`) ??
            captures.find((c) => c.id === card.id);
          if (!cap) throw new Error("capture-mismatch");
          return cap;
        });

        const buffer = await buildProductSheetExcelBuffer(request.cards, ordered);
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(
          blob,
          buildSheetExportFilename(request.cards.length, request.selectedOnly)
        );
        request.resolve();
      } catch (e) {
        request.reject(e);
      } finally {
        if (!cancelled) setRequest(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [request]);

  const portal =
    request && mounted
      ? createPortal(
          <div
            ref={containerRef}
            style={{
              position: "fixed",
              left: -10000,
              top: 0,
              opacity: 1,
              pointerEvents: "none",
            }}
          >
            {request.cards.map((card, i) => (
              <ProductCard
                key={`${card.id}-${i}`}
                {...card}
                exportId={`${card.id}-${i}`}
                styleConfig={resolveSheetCardStyle(
                  card,
                  request.globalStyle,
                  request.brandStyles,
                  request.cardStyles
                )}
                interactive={false}
              />
            ))}
          </div>,
          document.body
        )
      : null;

  return { exportExcel, portal };
}
