"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SHEET_COLOR_THEMES } from "@/lib/product-sheet/colors";
import { ProductSheetFilters } from "@/lib/product-sheet/use-product-sheet";
import {
  Download,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

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
  onSave,
  onExportBackup,
  onImportBackup,
  onResetToDefaults,
  onClearSaved,
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
  onSave: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetToDefaults: () => void;
  onClearSaved: () => void;
  onExportExcel: () => void;
  onPrintSelected: () => void;
  exporting?: boolean;
}) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const exportCount = exportScope === "selected" ? selectedCount : total;
  const exportDisabled =
    exporting || (exportScope === "selected" ? selectedCount === 0 : total === 0);

  return (
    <div className="no-print mb-4 space-y-3 rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-black">필터 · 검색 · 다운로드</h2>
          <p className="text-[11px] text-muted-foreground">
            {visible} / {total}개 표시 · 그리드에서 Ctrl+클릭으로 여러 개 선택 ({selectedCount}개
            선택됨)
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
        </div>
      </div>

      <div className="rounded-md border border-dashed bg-muted/20 p-3">
        <div className="mb-2">
          <h3 className="text-xs font-black">저장 데이터 동기화</h3>
          <p className="text-[10px] text-muted-foreground">
            「저장」= 초기화 기준점(글씨·카드 크기 그대로). 「최신 기본값으로 초기화」는 마지막 저장
            상태로 되돌립니다. JSON 보내기·가져오기로 다른 PC와 맞출 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onExportBackup}>
            <Download className="size-3.5" /> 저장 데이터 보내기
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload className="size-3.5" /> 저장 데이터 가져오기
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportBackup(file);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={onSave}>
            <Save className="size-3.5" /> 저장 (클라우드 동기화)
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onResetToDefaults}>
            <RotateCcw className="size-3.5" /> 최신 기본값으로 초기화
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClearSaved}>
            <Trash2 className="size-3.5" /> 저장 데이터 삭제
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
