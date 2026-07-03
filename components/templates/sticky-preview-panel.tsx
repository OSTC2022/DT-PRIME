"use client";

import { cn } from "@/lib/utils";

/** 스크롤 시 상단(네비 아래)에 고정되는 미리보기 패널 */
export function StickyPreviewPanel({
  children,
  active = true,
  label,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid-paper p-4",
        active &&
          "sticky top-14 z-10 border-b bg-white/95 shadow-md backdrop-blur-sm supports-[backdrop-filter]:bg-white/80",
        className
      )}
    >
      {label ? <div className="mb-2">{label}</div> : null}
      <div className="flex justify-center">{children}</div>
    </div>
  );
}
