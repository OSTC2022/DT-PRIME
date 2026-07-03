"use client";

import { getSheetColorTheme } from "@/lib/product-sheet/colors";
import { AccentLineBar } from "@/components/product-sheet/accent-line-bar";
import { DividerBar } from "@/components/product-sheet/divider-bar";
import { SpacingGap } from "@/components/product-sheet/spacing-gap";
import {
  AccentOffsetKey,
  AccentTarget,
  resolveLineAccentColor,
  resolveLineAccentPercent,
  resolveLineAccentWidth,
} from "@/lib/product-sheet/accent-line-style";
import { PreviewFocus, PreviewRegionId } from "@/lib/product-sheet/preview-regions";
import { SpacingFieldKey } from "@/lib/product-sheet/spacing-fields";
import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import { accentColorForCard, buildTitleLines } from "@/lib/product-sheet/title-parts";
import { parsePriceVolumeDisplay } from "@/lib/product-sheet/price-display";
import { ProductSheetCardData, SHEET_CARD_HEIGHT, SHEET_CARD_WIDTH } from "@/lib/product-sheet/types";
import { cn } from "@/lib/utils";

export type ProductCardProps = ProductSheetCardData & {
  styleConfig?: ProductSheetStyleConfig;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  interactive?: boolean;
  exportId?: string;
  spacingEdit?: boolean;
  regionEdit?: boolean;
  onSpacingChange?: (patch: Partial<ProductSheetStyleConfig>) => void;
  previewFocus?: PreviewFocus | null;
  onRegionSelect?: (region: PreviewRegionId) => void;
  onSpacingSelect?: (key: SpacingFieldKey) => void;
  onAccentSelect?: (target: AccentTarget) => void;
};

function formatTagLines(tags: string[]): string[] {
  return tags.map((t) => t.trim()).filter(Boolean);
}

function isRegionActive(focus: PreviewFocus | null | undefined, region: PreviewRegionId) {
  return focus?.type === "region" && focus.region === region;
}

function isSpacingActive(focus: PreviewFocus | null | undefined, key: SpacingFieldKey) {
  return focus?.type === "spacing" && focus.key === key;
}

function zoneClass(
  regionEdit: boolean,
  focus: PreviewFocus | null | undefined,
  region: PreviewRegionId
) {
  if (!regionEdit) return undefined;
  return cn(
    "premium-card__zone premium-card__zone--editable",
    isRegionActive(focus, region) && "premium-card__zone--active"
  );
}

export function ProductCard({
  brand,
  line,
  title,
  highlight,
  tags = [],
  bottom,
  price,
  color,
  styleConfig,
  onClick,
  className,
  interactive = true,
  exportId,
  id,
  spacingEdit = false,
  regionEdit = false,
  onSpacingChange,
  previewFocus = null,
  onRegionSelect,
  onSpacingSelect,
  onAccentSelect,
}: ProductCardProps) {
  const theme = getSheetColorTheme(color);
  const s = styleConfig;
  const accent = accentColorForCard({ id, brand, line, title, highlight, tags, bottom, price, color });
  const highlightColor = s?.highlightColor?.trim() || accent;
  const accentLineColor = s?.accentColor?.trim() || theme.topLine;
  const lineAccentColor = resolveLineAccentColor(s, accentLineColor);
  const lineAccentWidth = resolveLineAccentWidth(s);
  const lineAccentPercent = resolveLineAccentPercent(s);
  const priceColor = s?.priceColor?.trim() || theme.price;
  const headerBg = s?.headerBackgroundColor ?? "#f6f7f9";
  const brandLineH = Math.max(1, s?.accentLineWidth ?? 2);
  const titleLines = buildTitleLines({ id, brand, line, title, highlight, tags, bottom, price, color });
  const tagLines = formatTagLines(tags);
  const priceVolume = parsePriceVolumeDisplay(price, bottom, brand);
  const pinBottom = (s?.pricePinBottom ?? 0) > 0;
  const priceBottomInset = pinBottom ? Math.max(0, s?.pricePinBottom ?? 0) : 0;
  const pricePinStyle =
    pinBottom && priceBottomInset > 0
      ? { marginBottom: -Math.max(0, (s?.bodyPaddingY ?? 8) - priceBottomInset) }
      : undefined;
  const setGap = (key: keyof ProductSheetStyleConfig, v: number) =>
    onSpacingChange?.({ [key]: v });
  const setAccentOffset = (key: AccentOffsetKey, v: number) =>
    onSpacingChange?.({ [key]: v });
  const gapEdit = spacingEdit && !!onSpacingChange;

  const pickRegion = (region: PreviewRegionId) => (e: React.MouseEvent) => {
    if (!regionEdit) return;
    e.stopPropagation();
    onRegionSelect?.(region);
  };

  const inner = (
    <>
      {line?.trim() ? (
        <div
          className="premium-card__accent-row premium-card__accent-row--end"
          style={{
            display: "flex",
            width: "100%",
            paddingLeft: 0,
            paddingRight: 0,
            flexShrink: 0,
            overflow: "visible",
            backgroundColor: headerBg,
            minHeight: Math.max(1, lineAccentWidth),
            alignItems: "center",
          }}
        >
          <AccentLineBar
            target="line"
            offsetKey="lineAccentOffsetX"
            offset={s?.lineAccentOffsetX ?? 0}
            widthPercent={lineAccentPercent}
            height={lineAccentWidth}
            color={lineAccentColor}
            anchor="right"
            offsetMin={0}
            offsetMax={Math.max(80, (s?.width ?? SHEET_CARD_WIDTH) - 20)}
            editable={gapEdit}
            regionEdit={regionEdit}
            previewFocus={previewFocus}
            onOffsetChange={setAccentOffset}
            onAccentSelect={onAccentSelect}
          />
        </div>
      ) : null}

      <div
        role={regionEdit ? "button" : undefined}
        tabIndex={regionEdit ? 0 : undefined}
        onClick={pickRegion("header")}
        onKeyDown={
          regionEdit
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onRegionSelect?.("header");
              }
            : undefined
        }
        className={cn("premium-card__header", zoneClass(regionEdit, previewFocus, "header"))}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          minHeight: s?.headerRowHeight ?? 32,
          backgroundColor: s?.headerBackgroundColor ?? "#f6f7f9",
          paddingLeft: s?.bodyPaddingX ?? 15,
          paddingRight: s?.bodyPaddingX ?? 15,
          flexShrink: 0,
        }}
      >
        <span
          className="min-w-0 flex-1 truncate text-left font-bold"
          style={{
            fontSize: s?.brandFontSize ?? 10,
            color: s?.brandColor ?? "#111827",
          }}
        >
          {brand}
        </span>
        {line?.trim() ? (
          <span
            className="shrink-0 text-right font-bold"
            style={{
              fontSize: s?.lineFontSize ?? 10,
              color: s?.categoryColor ?? "#9aa3af",
            }}
          >
            {line}
          </span>
        ) : (
          <span />
        )}
      </div>

      <div
        className="premium-card__accent-row"
        style={{
          display: "flex",
          width: "100%",
          paddingLeft: 0,
          paddingRight: 0,
          flexShrink: 0,
          overflow: "visible",
          backgroundColor: headerBg,
          minHeight: brandLineH,
          alignItems: "center",
        }}
      >
        <AccentLineBar
          target="brand"
          offsetKey="accentLineOffsetX"
          offset={s?.accentLineOffsetX ?? 0}
          widthPercent={s?.accentLinePercent ?? 50}
          height={s?.accentLineWidth ?? 2}
          color={accentLineColor}
          anchor="left"
          offsetMin={0}
          offsetMax={Math.max(80, (s?.width ?? SHEET_CARD_WIDTH) - 20)}
          editable={gapEdit}
          regionEdit={regionEdit}
          previewFocus={previewFocus}
          onOffsetChange={setAccentOffset}
          onAccentSelect={onAccentSelect}
        />
      </div>

      <SpacingGap
        fieldKey="bodyPaddingTop"
        value={s?.bodyPaddingTop ?? 2}
        editable={gapEdit}
        selected={isSpacingActive(previewFocus, "bodyPaddingTop")}
        label="강조선~제품명 여백"
        onSelect={onSpacingSelect}
        onChange={(v) => setGap("bodyPaddingTop", v)}
      />

      <div
        className="premium-card__body"
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          padding: `0 ${s?.bodyPaddingX ?? 15}px ${s?.bodyPaddingY ?? 8}px`,
        }}
      >
        <h3
          role={regionEdit ? "button" : undefined}
          tabIndex={regionEdit ? 0 : undefined}
          onClick={pickRegion("title")}
          onKeyDown={
            regionEdit
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") onRegionSelect?.("title");
                }
              : undefined
          }
          className={cn(
            "premium-card__title",
            s?.titleSingleLine && titleLines.secondary && "premium-card__title--single-line",
            zoneClass(regionEdit, previewFocus, "title")
          )}
        >
          <span
            className="premium-card__title-line"
            style={{
              fontSize: s?.titleFontSize ?? 13,
              color: s?.titleColor ?? "#111827",
            }}
          >
            {titleLines.primary}
          </span>
          {titleLines.secondary ? (
            <span
              className="premium-card__title-line premium-card__title-accent"
              style={{
                fontSize: s?.highlightFontSize ?? s?.titleFontSize ?? 13,
                color: highlightColor,
              }}
            >
              {titleLines.secondary}
            </span>
          ) : null}
        </h3>

        <SpacingGap
          fieldKey="titleMarginBottom"
          value={s?.titleMarginBottom ?? 2}
          editable={gapEdit}
          selected={isSpacingActive(previewFocus, "titleMarginBottom")}
          label="제품명 ↔ 구분선"
          onSelect={onSpacingSelect}
          onChange={(v) => setGap("titleMarginBottom", v)}
        />

        <DividerBar
          color={s?.dividerColor ?? "#d8dee6"}
          editable={gapEdit}
          regionEdit={regionEdit}
          previewFocus={previewFocus}
          topGap={s?.titleMarginBottom ?? 2}
          onTopGapChange={(v) => setGap("titleMarginBottom", v)}
          onDividerSelect={() => onRegionSelect?.("divider")}
        />

        <SpacingGap
          fieldKey="dividerMarginBottom"
          value={s?.dividerMarginBottom ?? 4}
          editable={gapEdit}
          selected={isSpacingActive(previewFocus, "dividerMarginBottom")}
          label="구분선 ↔ 해시태그"
          onSelect={onSpacingSelect}
          onChange={(v) => setGap("dividerMarginBottom", v)}
        />

        <div
          role={regionEdit ? "button" : undefined}
          tabIndex={regionEdit ? 0 : undefined}
          onClick={pickRegion("tags")}
          onKeyDown={
            regionEdit
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") onRegionSelect?.("tags");
                }
              : undefined
          }
          className={cn(
            "premium-card__tags",
            (pinBottom) && "premium-card__tags--grow",
            zoneClass(regionEdit, previewFocus, "tags")
          )}
          style={{
            fontSize: s?.tagFontSize ?? 9,
            gap: s?.tagLineGap ?? 2,
          }}
        >
          {tagLines.length > 0 ? (
            tagLines.map((row, i) => (
              <p key={i} style={{ color: s?.tagColor ?? "#111827" }}>
                {row}
              </p>
            ))
          ) : (
            <p className="invisible">.</p>
          )}
        </div>

        <SpacingGap
          fieldKey="tagPriceGap"
          value={s?.tagPriceGap ?? 2}
          editable={gapEdit}
          selected={isSpacingActive(previewFocus, "tagPriceGap")}
          label="해시태그~가격 간격"
          onSelect={onSpacingSelect}
          onChange={(v) => setGap("tagPriceGap", v)}
        />

        {priceVolume && (
          <div
            role={regionEdit ? "button" : undefined}
            tabIndex={regionEdit ? 0 : undefined}
            onClick={pickRegion("price")}
            onKeyDown={
              regionEdit
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") onRegionSelect?.("price");
                  }
                : undefined
            }
            className={cn(
              "premium-card__price-row",
              priceVolume.lines.length > 1 && "premium-card__price-row--stacked",
              pinBottom && "premium-card__price-row--pin-bottom",
              zoneClass(regionEdit, previewFocus, "price")
            )}
            style={pricePinStyle}
          >
            {priceVolume.lines.map((line, i) => (
              <div key={i} className="premium-card__price-line">
                {line.priceText ? (
                  <span
                    className="premium-card__price"
                    style={{
                      fontSize: s?.priceFontSize ?? 14,
                      color: priceColor,
                    }}
                  >
                    {line.priceText}
                  </span>
                ) : null}
                {line.volumeText ? (
                  <span
                    className="premium-card__volume"
                    style={{
                      fontSize: s?.bottomFontSize ?? 8,
                      color: s?.bottomColor ?? "#1f2937",
                    }}
                  >
                    ({line.volumeText})
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const cardW = styleConfig?.width ?? SHEET_CARD_WIDTH;
  const cardH = styleConfig?.height ?? SHEET_CARD_HEIGHT;

  const boxStyle = {
    display: "flex",
    flexDirection: "column" as const,
    width: cardW,
    height: cardH,
    borderRadius: s?.borderRadius ?? 9,
    borderWidth: s?.borderWidth ?? 1,
    borderStyle: "solid" as const,
    borderColor: s?.borderColor ?? "#e2e6ea",
    backgroundColor: s?.backgroundColor ?? "#fff",
    overflow: gapEdit ? ("visible" as const) : ("hidden" as const),
  };

  if (!interactive) {
    return (
      <div
        data-export-card={exportId ?? id}
        className={cn("product-card premium-card", gapEdit && "premium-card--spacing-edit", className)}
        style={boxStyle}
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-sheet-card={id}
      className={cn(
        "product-card premium-card group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      style={boxStyle}
    >
      {inner}
    </button>
  );
}
