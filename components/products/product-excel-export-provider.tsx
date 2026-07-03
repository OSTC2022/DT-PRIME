"use client";

import { PriceCard } from "@/components/cards/price-card";
import { CardStyleConfig } from "@/lib/template-styles";
import {
  buildExportFilename,
  buildProductsExcelBuffer,
  CardCapture,
} from "@/lib/products/export-excel";
import { CardShape, ProductItem } from "@/lib/types";
import { saveAs } from "file-saver";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ExportOptions = {
  products: ProductItem[];
  templateStyles: Record<string, CardStyleConfig>;
  shape: CardShape;
  selectedIds?: string[];
};

type ExportRequest = ExportOptions & {
  resolve: () => void;
  reject: (error: unknown) => void;
};

const ProductExcelExportContext = createContext<{
  exportExcel: (options: ExportOptions) => Promise<void>;
} | null>(null);

export function useProductExcelExport() {
  const ctx = useContext(ProductExcelExportContext);
  if (!ctx) {
    throw new Error("ProductExcelExportProvider가 필요합니다.");
  }
  return ctx;
}

async function waitForExportContainer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  expectedCount: number
): Promise<HTMLElement> {
  for (let i = 0; i < 30; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const container = containerRef.current;
    if (
      container &&
      container.querySelectorAll("[data-export-card]").length === expectedCount
    ) {
      return container;
    }
  }
  throw new Error("export-container-missing");
}

async function captureCards(container: HTMLElement): Promise<CardCapture[]> {
  const { toPng } = await import("html-to-image");
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>("[data-export-card]")
  );

  const captures: CardCapture[] = [];
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

export function ProductExcelExportProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ExportRequest | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const exportExcel = useCallback((options: ExportOptions) => {
    const list =
      options.selectedIds && options.selectedIds.length > 0
        ? options.products.filter((p) => options.selectedIds!.includes(p.id))
        : options.products;

    if (list.length === 0) {
      return Promise.reject(new Error("empty"));
    }

    return new Promise<void>((resolve, reject) => {
      setRequest({
        ...options,
        products: list,
        resolve,
        reject,
      });
    });
  }, []);

  useEffect(() => {
    if (!request) return;

    let cancelled = false;

    (async () => {
      try {
        await document.fonts.ready;
        if (cancelled) return;

        const container = await waitForExportContainer(
          containerRef,
          request.products.length
        );
        if (cancelled) return;

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        if (cancelled) return;

        const captures = await captureCards(container);
        if (captures.length === 0) {
          throw new Error("capture-failed");
        }

        const ordered = request.products
          .map((p) => captures.find((c) => c.id === p.id))
          .filter((c): c is CardCapture => Boolean(c));

        const buffer = await buildProductsExcelBuffer(request.products, ordered);
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const selectedOnly = Boolean(request.selectedIds && request.selectedIds.length > 0);
        saveAs(blob, buildExportFilename(request.products.length, selectedOnly));
        request.resolve();
      } catch (error) {
        request.reject(error);
      } finally {
        if (!cancelled) setRequest(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [request]);

  const portal =
    request && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={containerRef}
            aria-hidden
            className="export-capture-root"
            style={{
              position: "fixed",
              left: -10000,
              top: 0,
              zIndex: -1,
              opacity: 1,
              pointerEvents: "none",
              backgroundColor: "#ffffff",
            }}
          >
            {request.products.map((p) => {
              const style = request.templateStyles[p.templateType];
              const width = style?.width ?? 220;
              const height = style?.height ?? 165;
              return (
                <div
                  key={p.id}
                  data-export-card={p.id}
                  style={{
                    width,
                    height,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <PriceCard item={p} shape={request.shape} styleConfig={style} />
                </div>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <ProductExcelExportContext.Provider value={{ exportExcel }}>
      {children}
      {portal}
    </ProductExcelExportContext.Provider>
  );
}
