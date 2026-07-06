"use client";

import { ProductSheetManager } from "@/components/product-sheet/product-sheet-manager";
import { PRODUCT_SHEET_CARD_COUNT } from "@/lib/product-sheet/initial-data";
import { SHEET_COLUMNS } from "@/lib/product-sheet/types";

export default function ProductCardTemplatePage() {
  return (
    <div className="p-4 md:p-6">
      <header className="no-print mb-4">
        <h1 className="text-lg font-black">제품 관리 카드 시트</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          엑셀 기준 열 너비 28 · 행 높이 110 (카드 215×160px) · 한 줄 3열 · 엑셀은 웹 카드
          이미지 캡처로 저장합니다. 총 {PRODUCT_SHEET_CARD_COUNT}개({SHEET_COLUMNS}열 그리드).
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          일괄 편집으로 크기·색상·글씨를 조절하고, Ctrl+클릭으로 카드를 선택해 인쇄·엑셀 다운로드하세요.
        </p>
      </header>

      <ProductSheetManager />
    </div>
  );
}
