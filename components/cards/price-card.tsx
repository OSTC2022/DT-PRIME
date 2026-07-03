import { ProductItem } from "@/lib/types";
import { CardStyleConfig } from "@/lib/template-styles";
import { resolveCardStyle } from "@/lib/card-style-utils";
import { clampOffsetPercent } from "@/lib/template-offset";
import { won, krw } from "@/lib/utils";
import { cn } from "@/lib/utils";
import React, { CSSProperties } from "react";

function highlightName(
  name: string,
  words: string[],
  color: string,
  baseStyle?: React.CSSProperties
) {
  if (!words.length) return <span style={baseStyle}>{name}</span>;
  const escaped = words
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  if (!escaped.length) return <span style={baseStyle}>{name}</span>;
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = name.split(re);
  return (
    <span style={baseStyle}>
      {parts.map((p, i) =>
        words.some((w) => w === p) ? (
          <span key={i} style={{ color }}>
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </span>
  );
}

function formatTags(tags?: string[]) {
  return (tags ?? []).map((t) => (t.startsWith("#") ? t : `#${t}`));
}

/** 탭·라벨 영역 안에서 0~100% 위치 */
function PositionedLabel({
  text,
  fontStyle,
  positionPct,
  className,
  minHeight,
}: {
  text: string;
  fontStyle: CSSProperties;
  positionPct?: number;
  className?: string;
  minHeight?: number | string;
}) {
  const pct = clampOffsetPercent(positionPct);
  return (
    <div
      className={cn("relative w-full overflow-visible", className)}
      style={{ minHeight: minHeight ?? "2rem" }}
    >
      <span
        style={{
          ...fontStyle,
          position: "absolute",
          left: `${pct}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function PracticalCard({
  item,
  shape,
  className,
  styleConfig,
}: {
  item: ProductItem;
  shape: "square" | "wide";
  className?: string;
  styleConfig?: CardStyleConfig;
}) {
  const s = resolveCardStyle(styleConfig, item);
  const tags = formatTags(item.tags);
  const line1 = tags.slice(0, 3).join(" ");
  const line2 = tags.slice(3).join(" ");
  const tabH = styleConfig?.tabBarHeight ?? 24;
  const tabBorder = styleConfig?.activeTabBorderWidth ?? 2;
  const aspect = styleConfig
    ? "h-full w-full"
    : shape === "wide"
    ? "aspect-[5/4] min-h-[220px]"
    : "aspect-[4/5] min-h-[280px]";

  return (
    <div
      className={cn("flex flex-col", aspect, className)}
      style={{
        ...s.box,
        backgroundColor: styleConfig ? s.tabBg : "#f5f5f5",
        borderRadius: styleConfig?.borderRadius ?? 12,
      }}
    >
      <div
        className="flex shrink-0 overflow-visible border-b px-1 pb-0.5 pt-1"
        style={{ backgroundColor: s.tabBg, borderColor: s.divider }}
      >
        <div
          className="relative flex-1 py-0.5"
          style={{
            minHeight: tabH,
            borderBottom: `${tabBorder}px solid ${s.accent}`,
          }}
        >
          <PositionedLabel
            text={item.brand || "브랜드"}
            fontStyle={s.brand}
            positionPct={styleConfig?.brandOffsetX}
            minHeight={tabH}
          />
        </div>
        <div className="relative flex-1 py-0.5" style={{ minHeight: tabH }}>
          <PositionedLabel
            text={item.tab2 ?? item.category ?? "카테고리"}
            fontStyle={s.tabInactive}
            positionPct={styleConfig?.categoryOffsetX}
            minHeight={tabH}
          />
        </div>
      </div>

      <div
        className="flex flex-1 flex-col justify-between overflow-hidden px-4 py-4 text-center shadow-sm"
        style={{
          backgroundColor: s.bodyBg,
          borderRadius: `0 0 ${styleConfig?.borderRadius ?? 12}px ${styleConfig?.borderRadius ?? 12}px`,
        }}
      >
        <div>
          <h3 className="leading-snug tracking-tight">
            {highlightName(item.name, item.highlightWords ?? [], s.highlight.color, s.title)}
          </h3>
          <div className="mx-2 mt-3 border-t" style={{ borderColor: s.divider }} />
        </div>

        <div className="space-y-1 py-4">
          {line1 ? <p style={s.tags}>{line1}</p> : null}
          {line2 ? <p style={s.tags}>{line2}</p> : null}
        </div>

        <p>
          <span style={s.price}>{item.price.toLocaleString("ko-KR")}</span>
          <span style={s.priceSuffix}>원</span>
          {item.volume ? <span style={s.volume}> ({item.volume})</span> : null}
        </p>
      </div>
    </div>
  );
}

export function PriceCard({
  item,
  shape = "square",
  className,
  styleConfig,
}: {
  item: ProductItem;
  shape?: "square" | "wide";
  className?: string;
  styleConfig?: CardStyleConfig;
}) {
  const t = item.templateType;
  const s = resolveCardStyle(styleConfig, item);
  const accent = s.accent;
  const aspect = styleConfig ? "h-full w-full" : shape === "wide" ? "aspect-[16/9]" : "aspect-[4/3]";

  if (t === "practical") {
    return (
      <PracticalCard item={item} shape={shape} className={className} styleConfig={styleConfig} />
    );
  }

  if (t === "dark") {
    return (
      <div
        className={cn(aspect, "flex flex-col justify-between p-5 text-center text-white", className)}
        style={s.box ?? { backgroundColor: "#111", borderRadius: 8 }}
      >
        <div>
          {item.category && (
            <PositionedLabel
              text={item.category}
              fontStyle={s.category}
              positionPct={styleConfig?.categoryOffsetX}
            />
          )}
          <div className="mt-1 leading-tight" style={s.title}>
            {item.name}
          </div>
        </div>
        <div className="flex items-baseline justify-center gap-2">
          {item.volume && <span style={s.volume}>[{item.volume}]</span>}
          <span style={s.price}>{won(item.price)}</span>
        </div>
      </div>
    );
  }

  if (t === "event") {
    return (
      <div
        className={cn(aspect, "relative flex flex-col justify-between overflow-hidden p-5 text-center", className)}
        style={s.box ?? { backgroundColor: "#fff", border: "2px solid #dc2626", borderRadius: 8 }}
      >
        <span className="absolute -right-8 top-3 rotate-45 bg-red-600 px-8 py-0.5 text-[9px] font-black text-white">
          {item.eventText || "행사"}
        </span>
        <div>
          {item.category && (
            <PositionedLabel
              text={item.category}
              fontStyle={s.category}
              positionPct={styleConfig?.categoryOffsetX}
            />
          )}
          <div className="mt-1 leading-tight" style={s.title}>
            {item.name}
          </div>
        </div>
        <div className="flex flex-col items-center">
          {item.wholesalePrice ? (
            <span className="line-through" style={{ ...s.volume, opacity: 0.6 }}>
              {krw(item.wholesalePrice)}
            </span>
          ) : null}
          <div className="flex items-baseline gap-2">
            {item.volume && <span style={s.volume}>[{item.volume}]</span>}
            <span style={s.price}>{won(item.price)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (t === "set") {
    return (
      <div
        className={cn(aspect, "flex flex-col justify-between p-5 text-center", className)}
        style={s.box ?? { backgroundColor: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 8 }}
      >
        <div>
          <PositionedLabel text="SET" fontStyle={s.category} positionPct={styleConfig?.categoryOffsetX} />
          <div className="mt-1 leading-tight" style={s.title}>
            {item.name}
          </div>
          {item.subtitle && (
            <div className="mt-1" style={s.subtitle}>
              {item.subtitle}
            </div>
          )}
        </div>
        <div className="flex items-baseline justify-center gap-2">
          {item.volume && <span style={s.volume}>[{item.volume}]</span>}
          <span style={s.price}>{won(item.price)}</span>
        </div>
      </div>
    );
  }

  if (t === "line") {
    return (
      <div
        className={cn(aspect, "flex flex-col justify-between overflow-hidden text-center shadow-sm", className)}
        style={s.box ?? { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}
      >
        <div className="h-2 w-full" style={{ background: accent }} />
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            {item.category && (
              <PositionedLabel
                text={item.category}
                fontStyle={s.category}
                positionPct={styleConfig?.categoryOffsetX}
              />
            )}
            <div className="mt-1 leading-tight" style={s.title}>
              {item.name}
            </div>
          </div>
          <div className="flex items-baseline justify-center gap-2">
            {item.volume && <span style={s.volume}>[{item.volume}]</span>}
            <span style={s.price}>{won(item.price)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (t === "rounded") {
    return (
      <div
        className={cn(aspect, "flex flex-col justify-between p-5 text-center shadow-md", className)}
        style={s.box ?? { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 16 }}
      >
        <div>
          {item.category && (
            <PositionedLabel
              text={item.category}
              fontStyle={s.category}
              positionPct={styleConfig?.categoryOffsetX}
            />
          )}
          <div className="mt-1 leading-tight" style={s.title}>
            {item.name}
          </div>
        </div>
        <div className="flex items-baseline justify-center gap-2">
          {item.volume && <span style={s.volume}>[{item.volume}]</span>}
          <span style={s.price}>{won(item.price)}</span>
        </div>
      </div>
    );
  }

  if (t === "premium") {
    return (
      <div
        className={cn(aspect, "flex flex-col justify-between p-6 text-center", className)}
        style={s.box ?? { backgroundColor: "#fff", border: "1px solid #d4d4d4", borderRadius: 8 }}
      >
        <div>
          {item.brand && (
            <PositionedLabel
              text={item.brand}
              fontStyle={{ ...s.brand, letterSpacing: "0.2em" }}
              positionPct={styleConfig?.brandOffsetX}
            />
          )}
          <div className="mt-2 leading-snug tracking-tight" style={s.title}>
            {item.name}
          </div>
          {item.subtitle && (
            <div className="mt-1" style={s.subtitle}>
              {item.subtitle}
            </div>
          )}
        </div>
        <div>
          <div className="mx-6 border-t" style={{ borderColor: s.divider }} />
          <div className="mt-3 flex items-baseline justify-center gap-2">
            {item.volume && <span style={s.volume}>{item.volume}</span>}
            <span style={s.price}>{won(item.price)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(aspect, "flex flex-col justify-between p-5 text-center", className)}
      style={s.box ?? { backgroundColor: "#fff", border: "2px solid #171717", borderRadius: 8 }}
    >
      <div>
        {item.category && (
          <PositionedLabel
            text={item.category}
            fontStyle={s.category}
            positionPct={styleConfig?.categoryOffsetX}
          />
        )}
        <div className="mt-1 leading-tight" style={s.title}>
          {item.name}
        </div>
        <div className="mx-2 mt-3 border-t-2" style={{ borderColor: styleConfig?.borderColor ?? "#171717" }} />
      </div>
      <div className="flex items-baseline justify-center gap-2">
        {item.volume && <span style={s.volume}>[{item.volume}]</span>}
        <span style={s.price}>{won(item.price)}</span>
      </div>
    </div>
  );
}
