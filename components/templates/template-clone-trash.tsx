"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { PRODUCT_TEMPLATES } from "@/lib/templates";
import { RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TemplateCloneTrashBin() {
  const trashed = useStore((s) => s.trashedTemplateClones);
  const { restoreTemplateClone, purgeTemplateClone } = useStore();
  const [open, setOpen] = useState(false);

  const templateLabel = (id: string) =>
    PRODUCT_TEMPLATES.find((t) => t.id === id)?.label ?? id;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border bg-background px-4 py-2.5 text-sm font-bold shadow-lg transition hover:bg-muted",
          trashed.length > 0 ? "border-destructive/40" : ""
        )}
        title="삭제한 복제 카드 휴지통"
      >
        <Trash2 className={cn("size-4", trashed.length > 0 ? "text-destructive" : "text-muted-foreground")} />
        휴지통
        {trashed.length > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground">
            {trashed.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="닫기"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[min(80vh,520px)] w-full max-w-md flex-col rounded-lg border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Trash2 className="size-4 text-muted-foreground" />
                <h3 className="font-black">복제 카드 휴지통</h3>
                {trashed.length > 0 ? (
                  <span className="text-xs text-muted-foreground">({trashed.length})</span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-3">
              {trashed.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">휴지통이 비어 있어요.</p>
              ) : (
                <ul className="space-y-2">
                  {trashed.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {templateLabel(item.sourceTemplateId)} ·{" "}
                          {new Date(item.deletedAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-[11px]"
                          onClick={() => {
                            restoreTemplateClone(item.id);
                            toast.success(`"${item.label}" 카드를 복구했어요.`);
                          }}
                        >
                          <RotateCcw className="size-3" /> 복구
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => {
                            purgeTemplateClone(item.id);
                            toast.success("영구 삭제했어요.");
                          }}
                          title="영구 삭제"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
