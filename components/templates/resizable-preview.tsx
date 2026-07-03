"use client";

import { useCallback, useRef } from "react";
import { GripHorizontal } from "lucide-react";

export function ResizablePreview({
  width,
  height,
  onResize,
  children,
}: {
  width: number;
  height: number;
  onResize: (size: { width: number; height: number }) => void;
  children: React.ReactNode;
}) {
  const dragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = width;
      const startH = height;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        onResize({
          width: Math.round(Math.max(100, Math.min(480, startW + ev.clientX - startX))),
          height: Math.round(Math.max(90, Math.min(560, startH + ev.clientY - startY))),
        });
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [width, height, onResize]
  );

  return (
    <div className="relative inline-block" style={{ width, height }}>
      {children}
      <button
        type="button"
        aria-label="카드 크기 조절"
        onMouseDown={onMouseDown}
        className="absolute -bottom-1 -right-1 z-10 flex size-6 cursor-se-resize items-center justify-center rounded-md border bg-white shadow-md hover:bg-muted"
      >
        <GripHorizontal className="size-3.5 rotate-[-45deg] text-muted-foreground" />
      </button>
      <span className="absolute -bottom-5 left-0 text-[10px] text-muted-foreground">
        {width} × {height}px
      </span>
    </div>
  );
}
