"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SheetStyleKey } from "@/lib/product-sheet/style-fields";
import {
  effectiveSheetColor,
  isAutoSheetColor,
  SheetColorFallbacks,
} from "@/lib/product-sheet/style-color-fallbacks";

export function SheetStyleColorInput({
  fieldKey,
  value,
  fallbacks = {},
  onChange,
}: {
  fieldKey: SheetStyleKey;
  value: string;
  fallbacks?: SheetColorFallbacks;
  onChange: (value: string) => void;
}) {
  const stored = value?.trim() ?? "";
  const auto = isAutoSheetColor(fieldKey, stored);
  const display = effectiveSheetColor(fieldKey, stored, fallbacks);

  return (
    <div className="flex gap-1">
      <input
        type="color"
        value={display.startsWith("#") ? display : "#111827"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded border"
      />
      <Input
        value={auto ? display : stored}
        placeholder={auto ? undefined : display}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1"
      />
      {!auto ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 px-2 text-[10px]"
          onClick={() => onChange("")}
        >
          자동
        </Button>
      ) : null}
    </div>
  );
}
