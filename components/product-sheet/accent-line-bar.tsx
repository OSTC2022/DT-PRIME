"use client";

import { useCallback, useRef, useState } from "react";
import { AccentOffsetKey, AccentTarget } from "@/lib/product-sheet/accent-line-style";
import { PreviewFocus } from "@/lib/product-sheet/preview-regions";
import { cn } from "@/lib/utils";

function isAccentActive(focus: PreviewFocus | null | undefined, target: AccentTarget) {
  return focus?.type === "accent" && focus.target === target;
}

export function AccentLineBar({
  target,
  offsetKey,
  offset,
  widthPercent,
  height,
  color,
  editable = false,
  regionEdit = false,
  previewFocus = null,
  onOffsetChange,
  onAccentSelect,
  anchor = "left",
  offsetMin = 0,
  offsetMax = 80,
}: {
  target: AccentTarget;
  offsetKey: AccentOffsetKey;
  offset: number;
  widthPercent: number;
  height: number;
  color: string;
  editable?: boolean;
  regionEdit?: boolean;
  previewFocus?: PreviewFocus | null;
  onOffsetChange?: (key: AccentOffsetKey, value: number) => void;
  onAccentSelect?: (target: AccentTarget) => void;
  /** left: 0=카드 왼쪽 끝, +값=오른쪽 이동 / right: 0=카드 오른쪽 끝, +값=왼쪽 이동 */
  anchor?: "left" | "right";
  offsetMin?: number;
  offsetMax?: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [live, setLive] = useState(offset);
  const startRef = useRef({ x: 0, v: 0 });
  const active = isAccentActive(previewFocus, target);
  const shown = dragging ? live : offset;
  const lineH = Math.max(1, height);
  const translate =
    anchor === "right" ? `translateX(-${shown}px)` : `translateX(${shown}px)`;

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editable || !onOffsetChange) return;
      e.preventDefault();
      e.stopPropagation();
      onAccentSelect?.(target);
      setDragging(true);
      setLive(offset);
      startRef.current = { x: e.clientX, v: offset };

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startRef.current.x;
        const next =
          anchor === "right"
            ? Math.round(
                Math.max(offsetMin, Math.min(offsetMax, startRef.current.v - dx))
              )
            : Math.round(
                Math.max(offsetMin, Math.min(offsetMax, startRef.current.v + dx))
              );
        setLive(next);
        onOffsetChange(offsetKey, next);
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [editable, onOffsetChange, onAccentSelect, target, offset, offsetKey, anchor, offsetMin, offsetMax]
  );

  const pickAccent = (e: React.MouseEvent) => {
    if (!regionEdit) return;
    e.stopPropagation();
    onAccentSelect?.(target);
  };

  return (
    <div
      className={cn(
        "premium-card__accent-wrap",
        anchor === "right" && "premium-card__accent-wrap--right",
        regionEdit && "premium-card__zone premium-card__zone--editable",
        active && "premium-card__zone--active"
      )}
      style={{
        width: `${Math.max(4, widthPercent)}%`,
        transform: translate,
        marginLeft: anchor === "right" ? "auto" : undefined,
      }}
      onClick={pickAccent}
      role={regionEdit ? "button" : undefined}
      tabIndex={regionEdit ? 0 : undefined}
      onKeyDown={
        regionEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onAccentSelect?.(target);
            }
          : undefined
      }
    >
      <div
        className="premium-card__accent-line"
        style={{ width: "100%", height: lineH, backgroundColor: color }}
      />
      {editable ? (
        <div
          className={cn(
            "premium-card__accent-offset-hit",
            (dragging || active) && "premium-card__accent-offset-hit--active"
          )}
          onMouseDown={onMouseDown}
          title={
            anchor === "right"
              ? "좌우 드래그 (0=오른쪽 끝)"
              : "좌우 드래그 (0=왼쪽 끝)"
          }
        >
          {(dragging || active) && (
            <span className="premium-card__accent-offset-label">{shown}px</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
