"use client";

import { useCallback, useRef, useState } from "react";
import { PreviewFocus } from "@/lib/product-sheet/preview-regions";
import { cn } from "@/lib/utils";

function isDividerActive(focus: PreviewFocus | null | undefined) {
  return focus?.type === "region" && focus.region === "divider";
}

/** 구분선 본체 — 여백은 바깥 SpacingGap이 담당 */
export function DividerBar({
  color,
  editable = false,
  regionEdit = false,
  previewFocus = null,
  topGap,
  onTopGapChange,
  onDividerSelect,
}: {
  color: string;
  editable?: boolean;
  regionEdit?: boolean;
  previewFocus?: PreviewFocus | null;
  topGap: number;
  onTopGapChange?: (top: number) => void;
  onDividerSelect?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [liveTop, setLiveTop] = useState(topGap);
  const startRef = useRef({ y: 0, top: 0 });
  const active = isDividerActive(previewFocus);
  const shownTop = dragging ? liveTop : topGap;

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editable || !onTopGapChange) return;
      e.preventDefault();
      e.stopPropagation();
      onDividerSelect?.();
      setDragging(true);
      setLiveTop(topGap);
      startRef.current = { y: e.clientY, top: topGap };

      const onMove = (ev: MouseEvent) => {
        const dy = Math.round(ev.clientY - startRef.current.y);
        const nextTop = Math.max(0, Math.min(48, startRef.current.top + dy));
        setLiveTop(nextTop);
        onTopGapChange(nextTop);
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [editable, onTopGapChange, onDividerSelect, topGap]
  );

  const pickDivider = (e: React.MouseEvent) => {
    if (!regionEdit) return;
    e.stopPropagation();
    onDividerSelect?.();
  };

  return (
    <div
      className={cn(
        "premium-card__divider-wrap",
        regionEdit && "premium-card__zone premium-card__zone--editable",
        active && "premium-card__zone--active"
      )}
      onClick={pickDivider}
      role={regionEdit ? "button" : undefined}
      tabIndex={regionEdit ? 0 : undefined}
      onKeyDown={
        regionEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onDividerSelect?.();
            }
          : undefined
      }
    >
      <div className="premium-card__divider" style={{ backgroundColor: color }} />
      {editable ? (
        <div
          className={cn(
            "premium-card__divider-drag-hit",
            (dragging || active) && "premium-card__divider-drag-hit--active"
          )}
          onMouseDown={onMouseDown}
          title="위아래 드래그로 제품명↔구분선 여백 조절"
        >
          {(dragging || active) && (
            <span className="premium-card__divider-drag-label">↑{shownTop}px</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
