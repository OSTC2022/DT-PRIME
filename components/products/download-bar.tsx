"use client";

import { Button } from "@/components/ui/button";
import { useProductExcelExport } from "@/components/products/product-excel-export-provider";
import { useStore } from "@/lib/store";
import { CardStyleConfig } from "@/lib/template-styles";
import { CardShape, ProductItem } from "@/lib/types";
import { FileSpreadsheet, ImageDown, FileDown, Printer } from "lucide-react";
import { printPage } from "@/lib/print";
import { toast } from "sonner";
import { useState } from "react";

export function DownloadBar({
  products = [],
  selectedIds,
  templateStyles,
  shape = "square",
}: {
  products?: ProductItem[];
  selectedIds?: string[];
  templateStyles?: Record<string, CardStyleConfig>;
  shape?: CardShape;
}) {
  const [exporting, setExporting] = useState(false);
  const storeStyles = useStore((s) => s.templateStyles);
  const styles = templateStyles ?? storeStyles;
  const { exportExcel } = useProductExcelExport();

  const soon = (label: string) =>
    toast.info(`${label} 기능은 연결 준비 중입니다.`, {
      description: "PNG / PDF는 추후 연결 예정입니다.",
    });

  const handleExcel = async () => {
    if (products.length === 0) {
      toast.error("보낼 상품이 없어요.");
      return;
    }

    const onlySelected = selectedIds && selectedIds.length > 0;
    const count = onlySelected ? selectedIds!.length : products.length;

    setExporting(true);
    try {
      await exportExcel({
        products,
        templateStyles: styles,
        shape,
        selectedIds: onlySelected ? selectedIds : undefined,
      });
      toast.success(
        onlySelected
          ? `선택한 ${count}개 카드를 엑셀로 다운로드했어요.`
          : `전체 ${count}개 카드를 엑셀로 다운로드했어요.`
      );
    } catch (e) {
      if (e instanceof Error && e.message === "empty") {
        toast.error("보낼 상품이 없어요.");
      } else {
        toast.error("엑셀 다운로드에 실패했어요.");
      }
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (selectedIds?.length) {
      printPage({ onlyIds: selectedIds });
      toast.success(`선택한 ${selectedIds.length}개 카드를 인쇄합니다.`);
    } else {
      printPage();
    }
  };

  const excelLabel =
    selectedIds && selectedIds.length > 0
      ? `엑셀 다운로드 (선택 ${selectedIds.length})`
      : `엑셀 다운로드 (전체 ${products.length})`;

  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleExcel} disabled={exporting || products.length === 0}>
        <FileSpreadsheet />
        {exporting ? "카드 캡처 중…" : excelLabel}
      </Button>
      <Button variant="outline" size="sm" onClick={() => soon("PNG 다운로드")}>
        <ImageDown /> PNG 다운로드
      </Button>
      <Button variant="outline" size="sm" onClick={() => soon("PDF 다운로드")}>
        <FileDown /> PDF 다운로드
      </Button>
      <Button variant="secondary" size="sm" onClick={handlePrint}>
        <Printer />
        {selectedIds?.length ? `선택 인쇄 (${selectedIds.length})` : "전체 인쇄"}
      </Button>
    </div>
  );
}
