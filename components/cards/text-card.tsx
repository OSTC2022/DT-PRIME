import { TextCard } from "@/lib/types";
import { resolveHighlightColor } from "@/lib/text-card-styles";
import { cn } from "@/lib/utils";
import React from "react";

const BG: Record<string, string> = {
  sky: "bg-sky-50 border-sky-200",
  yellow: "bg-amber-300 border-amber-400",
  rounded: "bg-white border-neutral-300",
  outline: "bg-white border-neutral-800",
};

/** 강조 단어를 색상으로 감싸 렌더 */
function highlight(text: string, words: string[], color: string) {
  if (!words.length) return text;
  const escaped = words
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  if (!escaped.length) return text;
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((p, i) =>
    escaped.some((w) => new RegExp(`^${w}$`).test(p)) ? (
      <span key={i} className="font-black" style={{ color }}>
        {p}
      </span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

export function TextCardView({ card, className }: { card: TextCard; className?: string }) {
  const bg = card.backgroundColor ? "" : BG[card.templateType] || BG.sky;
  const hlColor = resolveHighlightColor(card.highlightColor);
  const hasSize = card.width != null && card.height != null;
  const borderW = card.borderWidth != null ? "" : card.templateType === "outline" ? "border-2" : "border";
  const rounded = card.borderRadius != null ? "" : card.templateType === "outline" ? "rounded-md" : "rounded-2xl";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-6 text-center",
        !hasSize && "aspect-[4/3] w-full",
        rounded,
        borderW,
        bg,
        className
      )}
      style={{
        width: card.width ? `${card.width}px` : undefined,
        height: card.height ? `${card.height}px` : undefined,
        backgroundColor: card.backgroundColor || undefined,
        borderColor: card.borderColor || undefined,
        borderWidth: card.borderWidth != null ? `${card.borderWidth}px` : undefined,
        borderStyle: card.borderWidth != null || card.borderColor ? "solid" : undefined,
        borderRadius: card.borderRadius != null ? `${card.borderRadius}px` : undefined,
      }}
    >
      <div
        className="font-black leading-snug"
        style={{
          fontSize: card.titleFontSize ? `${card.titleFontSize}px` : undefined,
          color: card.titleColor ?? "#171717",
        }}
      >
        {highlight(card.title, card.highlightWords, hlColor)}
        {card.emoji ? <span className="ml-1">{card.emoji}</span> : null}
      </div>
      {card.content
        ? card.content.split("\n").map((line, i) => (
            <div
              key={i}
              className="mt-1 font-bold leading-snug"
              style={{
                fontSize: card.contentFontSize ? `${card.contentFontSize}px` : undefined,
                color: card.contentColor ?? "#262626",
              }}
            >
              {highlight(line, card.highlightWords, hlColor)}
            </div>
          ))
        : null}
    </div>
  );
}
