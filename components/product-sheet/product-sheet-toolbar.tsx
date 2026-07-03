"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SHEET_COLOR_THEMES } from "@/lib/product-sheet/colors";
import { ProductSheetFilters } from "@/lib/product-sheet/use-product-sheet";
import { FileSpreadsheet, Printer, RotateCcw, Search } from "lucide-react";

export type ProductSheetExportScope = "all" | "selected";

export function ProductSheetToolbar({
  filters,
  brands,
  colors,
  total,
  visible,
  selectedCount,
  exportScope,
  onExportScopeChange,
  onChange,
  onReset,
  onExportExcel,
  onPrintSelected,
  exporting = false,
}: {
  filters: ProductSheetFilters;
  brands: string[];
  colors: string[];
  total: number;
  visible: number;
  selectedCount: number;
  exportScope: ProductSheetExportScope;
  onExportScopeChange: (scope: ProductSheetExportScope) => void;
  onChange: (patch: Partial<ProductSheetFilters>) => void;
  onReset: () => void;
  onExportExcel: () => void;
  onPrintSelected: () => void;
  exporting?: boolean;
}) {
  const exportCount = exportScope === "selected" ? selectedCount : total;
  const exportDisabled =
    exporting || (exportScope === "selected" ? selectedCount === 0 : total === 0);

  return (
    <div className="no-print mb-4 space-y-3 rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-black">필터 · 검색 · 다운로드</h2>
          <p className="text-[11px] text-muted-foreground">
            {visible} / {total}개 표시 · 그리드에서 Ctrl+클릭으로 여러 개 선택 ({selectedCount}개 선택됨)
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="mb-1 block text-[10px] text-muted-foreground">엑셀 범위</Label>
            <Select
              value={exportScope}
              onChange={(e) => onExportScopeChange(e.target.value as ProductSheetExportScope)}
              className="h-9 min-w-[140px]"
            >
              <option value="all">전체 시트 ({total}개)</option>
              <option value="selected">선택한 카드만 ({selectedCount}개)</option>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={onExportExcel} disabled={exportDisabled}>
            <FileSpreadsheet className="size-3.5" />
            {exporting ? "엑셀 생성 중…" : `엑셀 다운로드 (${exportCount}개)`}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onPrintSelected}
            disabled={selectedCount === 0}
          >
            <Printer className="size-3.5" />
            선택 인쇄 ({selectedCount})
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" /> 초기 데이터로 복원
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="브랜드 · 제품명 · 해시태그 검색"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            className="h-9 pl-8"
          />
        </div>
        <Select
          value={filters.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          className="h-9"
        >
          <option value="">브랜드 전체</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <Select
          value={filters.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-9"
        >
          <option value="">색상 계열 전체</option>
          {colors.map((c) => (
            <option key={c} value={c}>
              {SHEET_COLOR_THEMES[c as keyof typeof SHEET_COLOR_THEMES]?.label ?? c}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
