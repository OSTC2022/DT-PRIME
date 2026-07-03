"use client";

import { useCallback, useRef, useState } from "react";
import { SpacingFieldKey } from "@/lib/product-sheet/spacing-fields";
import { cn } from "@/lib/utils";

export function SpacingGap({
  fieldKey,
  value,
  onChange,
  onSelect,
  selected = false,
  editable = false,
  label,
  min = 0,
  max = 48,
}: {
  fieldKey: SpacingFieldKey;
  value: number;
  onChange?: (value: number) => void;
  onSelect?: (key: SpacingFieldKey) => void;
  selected?: boolean;
  editable?: boolean;
  label: string;
  min?: number;
  max?: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [live, setLive] = useState(value);
  const startRef = useRef({ y: 0, v: 0 });

  const shown = dragging ? live : value;

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editable || !onChange) return;
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(fieldKey);
      setDragging(true);
      setLive(value);
      startRef.current = { y: e.clientY, v: value };

      const onMove = (ev: MouseEvent) => {
        const next = Math.round(
          Math.max(min, Math.min(max, startRef.current.v + (ev.clientY - startRef.current.y)))
        );
        setLive(next);
        onChange(next);
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [editable, onChange, onSelect, fieldKey, value, min, max]
  );

  if (!editable) {
    if (value <= 0) return null;
    return <div className="premium-card__spacing" style={{ height: value }} aria-hidden />;
  }

  if (value <= 0) {
    return (
      <div
        className={cn(
          "premium-card__spacing premium-card__spacing--editable premium-card__spacing--zero",
          selected && "premium-card__spacing--active"
        )}
        style={{ height: 0, position: "relative" }}
        title={`${label} — 클릭 후 드래그`}
        role="separator"
        aria-label={label}
        aria-selected={selected}
      >
        <div className="premium-card__spacing-hit premium-card__spacing-hit--zero" onMouseDown={onMouseDown}>
          <div className="premium-card__spacing-rail">
            <div className="premium-card__spacing-handle" />
            {selected && <span className="premium-card__spacing-label">0px</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "premium-card__spacing premium-card__spacing--editable",
        (dragging || selected) && "premium-card__spacing--active"
      )}
      style={{ height: shown, position: "relative" }}
      title={`${label} — 클릭 후 드래그`}
      role="separator"
      aria-label={label}
      aria-selected={selected}
    >
      {/* 실제 여백 높이는 shown(0 가능). 드래그 히트존만 오버레이 */}
      <div
        className="premium-card__spacing-hit"
        onMouseDown={onMouseDown}
      >
        <div className="premium-card__spacing-rail">
          <div className="premium-card__spacing-handle" />
          {(dragging || selected) && (
            <span className="premium-card__spacing-label">{shown}px</span>
          )}
        </div>
      </div>
    </div>
  );
}
