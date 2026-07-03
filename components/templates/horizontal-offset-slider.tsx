"use client";

import { useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { OFFSET_MAX, OFFSET_MIN, clampOffsetPercent } from "@/lib/template-offset";

export function HorizontalOffsetSlider({
  label,
  previewText,
  value,
  onChange,
  min = OFFSET_MIN,
  max = OFFSET_MAX,
  disabled,
}: {
  label: string;
  previewText?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = clampOffsetPercent(value);

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return pct;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + ratio * (max - min));
    },
    [min, max, pct]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onChange(valueFromClientX(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || disabled) return;
    onChange(valueFromClientX(e.clientX));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const thumbLeft = ((pct - min) / (max - min)) * 100;
  const centerLeft = ((50 - min) / (max - min)) * 100;

  return (
    <div className={disabled ? "opacity-50" : ""}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <Label className="text-[11px]">{label}</Label>
        <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      {previewText ? (
        <p className="mb-1.5 truncate text-xs font-bold">{previewText}</p>
      ) : null}
      <div
        ref={trackRef}
        className="relative h-8 cursor-ew-resize select-none rounded-md border bg-muted/40 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-muted-foreground/50"
          style={{ left: `${centerLeft}%` }}
        />
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow"
          style={{ left: `${thumbLeft}%` }}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground">
        <span>← 왼쪽 끝</span>
        <span>가운데</span>
        <span>오른쪽 끝 →</span>
      </div>
    </div>
  );
}
