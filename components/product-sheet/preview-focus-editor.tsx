"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetStyleColorInput } from "@/components/product-sheet/sheet-style-color-input";
import {
  fieldDefForKey,
  fieldKeysForFocus,
  labelForFocus,
  PreviewFocus,
} from "@/lib/product-sheet/preview-regions";
import { applySheetDimensions } from "@/lib/product-sheet/scale-style";
import { SheetStyleKey } from "@/lib/product-sheet/style-fields";
import { SheetColorFallbacks } from "@/lib/product-sheet/style-color-fallbacks";
import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import { cn } from "@/lib/utils";

export function PreviewFocusEditor({
  focus,
  style,
  onStyleChange,
  colorFallbacks = {},
}: {
  focus: PreviewFocus | null;
  style: ProductSheetStyleConfig;
  onStyleChange: (patch: Partial<ProductSheetStyleConfig>) => void;
  colorFallbacks?: SheetColorFallbacks;
}) {
  if (!focus) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/10 px-3 py-4 text-center text-[11px] text-muted-foreground">
        미리보기에서 제품명·포인트 라인·가격 등을 클릭하면 해당 수정 항목이 열립니다.
      </p>
    );
  }

  const keys = fieldKeysForFocus(focus);

  return (
    <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
      <h4 className="text-xs font-black text-primary">{labelForFocus(focus)} 수정</h4>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {keys.map((key) => {
          const def = fieldDefForKey(key);
          if (!def) return null;
          return (
            <div key={key} data-style-field={key}>
              <Label className="text-[11px]">{def.label}</Label>
              <div className="mt-0.5">
                {def.type === "color" ? (
                  <SheetStyleColorInput
                    fieldKey={key as SheetStyleKey}
                    value={String(style[key])}
                    fallbacks={colorFallbacks}
                    onChange={(v) => onStyleChange({ [key]: v })}
                  />
                ) : (
                  <Input
                    type="number"
                    value={Number(style[key])}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (key === "width") {
                        onStyleChange(applySheetDimensions(style, val, style.height));
                      } else if (key === "height") {
                        onStyleChange(applySheetDimensions(style, style.width, val));
                      } else {
                        onStyleChange({ [key]: val });
                      }
                    }}
                    className={cn(
                      "h-9",
                      (focus.type === "spacing" || focus.type === "accent") &&
                        "border-primary ring-1 ring-primary/30"
                    )}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
