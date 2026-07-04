export type PriceVolumeLine = {
  priceText: string;
  volumeText: string;
};

export type PriceVolumeLayout = "single" | "inline" | "stacked";

export type PriceVolumeDisplay = {
  layout: PriceVolumeLayout;
  lines: PriceVolumeLine[];
};

/** `35,000원 (10팩)` 같이 price 필드에 용량이 붙은 경우 분리 */
const PRICE_WITH_VOLUME = /^(.+?)\s*\(([^)]+)\)\s*$/;

const STACKED_SEP = /\s*\/\/\s*/;

function usesStackedSeparator(...texts: (string | undefined)[]): boolean {
  return texts.some((t) => STACKED_SEP.test(t ?? ""));
}

function splitStackedParts(text: string): string[] {
  if (!text.trim()) return [];
  return text
    .split(STACKED_SEP)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** 단일 `/` — `//`가 없을 때만 사용 */
function splitInlineParts(text: string): string[] {
  if (!text.trim() || STACKED_SEP.test(text)) return [];
  return text
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parsePricePart(part: string): { priceText: string; volumeText: string } {
  const embedded = part.match(PRICE_WITH_VOLUME);
  if (embedded) {
    return { priceText: embedded[1].trim(), volumeText: embedded[2].trim() };
  }
  return { priceText: part.trim(), volumeText: "" };
}

/** 브랜드명 끝 용량 — `도미나 크림 2% 40g` → `40g` */
const BRAND_VOLUME_TAIL =
  /\b(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:ml|mL|g|G|l|L|팩))\s*$/i;

function inferVolumeFromBrand(brand?: string): string {
  const m = (brand ?? "").trim().match(BRAND_VOLUME_TAIL);
  return m ? m[1].trim() : "";
}

/**
 * 가격·용량 표시 규칙
 * - `/`  → 한 줄: `48,000원 (30ml) / 70,000원 (100ml)`
 * - `//` → 두 줄: 위·아래 각각 가격+용량
 */
export function parsePriceVolumeDisplay(
  price?: string,
  bottom?: string,
  brand?: string
): PriceVolumeDisplay | null {
  let priceText = (price ?? "").trim();
  let volumeText = (bottom ?? "").trim();

  const stacked = usesStackedSeparator(priceText, volumeText);

  if (!stacked) {
    const embedded = priceText.match(PRICE_WITH_VOLUME);
    if (embedded && !volumeText) {
      priceText = embedded[1].trim();
      volumeText = embedded[2].trim();
    }
  }

  if (!volumeText) volumeText = inferVolumeFromBrand(brand);

  const priceParts = stacked ? splitStackedParts(priceText) : splitInlineParts(priceText);
  const normalizedPriceParts =
    priceParts.length > 0 ? priceParts : priceText ? [priceText] : [];

  if (normalizedPriceParts.length === 0) return null;

  const volumeParts = stacked ? splitStackedParts(volumeText) : splitInlineParts(volumeText);

  const lines: PriceVolumeLine[] = normalizedPriceParts.map((part, i) => {
    const parsed = parsePricePart(part);
    let vol = parsed.volumeText;
    if (!vol) {
      vol = volumeParts[i] ?? (volumeParts.length === 1 ? volumeParts[0] : "");
    }
    return { priceText: parsed.priceText, volumeText: vol };
  });

  if (lines.every((line) => !line.priceText)) return null;

  let layout: PriceVolumeLayout = "single";
  if (lines.length > 1) {
    layout = stacked ? "stacked" : "inline";
  }

  return { layout, lines };
}

/** `//`로 2줄 가격인지 — 188px 기본 높이 적용용 */
export function hasDualPriceLines(price?: string, bottom?: string): boolean {
  return parsePriceVolumeDisplay(price, bottom)?.layout === "stacked";
}
