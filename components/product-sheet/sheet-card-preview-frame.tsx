"use client";

import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import { cn } from "@/lib/utils";

/** 일괄 편집 미리보기와 동일한 카드 크기 프레임 */
export function SheetCardPreviewFrame({
  style,
  children,
  className,
}: {
  style: ProductSheetStyleConfig;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative mx-auto inline-block", className)}
      style={{ width: style.width, height: style.height }}
    >
      {children}
    </div>
  );
}
