"use client";

import { Printer } from "lucide-react";
import { printCardById } from "@/lib/print";
import { cn } from "@/lib/utils";

export function PrintCardButton({
  cardId,
  className,
  label = "이 카드 인쇄",
}: {
  cardId: string;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        printCardById(cardId);
      }}
      className={cn(
        "no-print rounded bg-blue-600/90 p-1 text-white hover:bg-blue-700",
        className
      )}
    >
      <Printer className="size-3.5" />
    </button>
  );
}
