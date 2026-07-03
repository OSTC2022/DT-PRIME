export type PriceVolumeLine = {
  priceText: string;
  volumeText: string;
};

export type PriceVolumeDisplay = {
  lines: PriceVolumeLine[];
};

/** `35,000원 (10팩)` 같이 price 필드에 용량이 붙은 경우 분리 */
const PRICE_WITH_VOLUME = /^(.+?)\s*\(([^)]+)\)\s*$/;

/** `50ml/500ml` → `50ml / 500ml` */
function normalizeSlashSpacing(text: string): string {
  return text.replace(/\s*\/\s*/g, " / ").trim();
}

function splitSlashParts(text: string): string[] {
  if (!text.trim()) return [];
  return text
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** 브랜드명 끝 용량 — `도미나 크림 2% 40g` → `40g` */
const BRAND_VOLUME_TAIL =
  /\b(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:ml|mL|g|G|l|L|팩))\s*$/i;

function inferVolumeFromBrand(brand?: string): string {
  const m = (brand ?? "").trim().match(BRAND_VOLUME_TAIL);
  return m ? normalizeSlashSpacing(m[1]) : "";
}

export function parsePriceVolumeDisplay(
  price?: string,
  bottom?: string,
  brand?: string
): PriceVolumeDisplay | null {
  let priceText = (price ?? "").trim();
  let volumeText = (bottom ?? "").trim();

  const embedded = priceText.match(PRICE_WITH_VOLUME);
  if (embedded) {
    priceText = embedded[1].trim();
    if (!volumeText) volumeText = embedded[2].trim();
  }

  if (!volumeText) volumeText = inferVolumeFromBrand(brand);

  priceText = normalizeSlashSpacing(priceText);
  volumeText = normalizeSlashSpacing(volumeText);

  const priceParts = splitSlashParts(priceText);
  if (priceParts.length === 0) return null;

  const volumeParts = splitSlashParts(volumeText);
  const lines: PriceVolumeLine[] = priceParts.map((part, i) => ({
    priceText: part,
    volumeText: volumeParts[i] ?? (volumeParts.length === 1 ? volumeParts[0] : ""),
  }));

  return { lines };
}

/** 가격이 `35,000원 / 98,000원`처럼 슬래시로 2개 이상인지 */
export function hasDualPriceLines(price?: string, bottom?: string): boolean {
  return (parsePriceVolumeDisplay(price, bottom)?.lines.length ?? 0) > 1;
}
