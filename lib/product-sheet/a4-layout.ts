export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_MARGIN_MM = 8;
export const A4_GAP_MM = 4;

/** 96dpi 기준 px → mm */
export function mmFromPx(px: number): number {
  return (px * 25.4) / 96;
}

export function a4ContentAreaMm() {
  return {
    widthMm: A4_WIDTH_MM - A4_MARGIN_MM * 2,
    heightMm: A4_HEIGHT_MM - A4_MARGIN_MM * 2,
  };
}

export type A4GridLayout = {
  cols: number;
  rows: number;
  perPage: number;
  cardWmm: number;
  cardHmm: number;
  contentWmm: number;
  contentHmm: number;
};

/** 균일 카드 크기용 (레거시·추정) */
export function computeA4Grid(cardWidthPx: number, cardHeightPx: number): A4GridLayout {
  const { widthMm: contentWmm, heightMm: contentHmm } = a4ContentAreaMm();
  const cardWmm = mmFromPx(cardWidthPx);
  const cardHmm = mmFromPx(cardHeightPx);

  const cols = Math.max(
    1,
    Math.floor((contentWmm + A4_GAP_MM) / (cardWmm + A4_GAP_MM))
  );
  const rows = Math.max(
    1,
    Math.floor((contentHmm + A4_GAP_MM) / (cardHmm + A4_GAP_MM))
  );

  return {
    cols,
    rows,
    perPage: cols * rows,
    cardWmm,
    cardHmm,
    contentWmm,
    contentHmm,
  };
}

export type A4CardSize = {
  widthPx: number;
  heightPx: number;
};

export type A4RowPlan<T> = {
  items: T[];
  heightMm: number;
};

export type A4PagePlan<T> = {
  rows: A4RowPlan<T>[];
};

const PAGE_FIT_EPS_MM = 0.05;

/** 카드마다 높이가 달라도 A4 안에 들어가도록 행·페이지 분할 */
export function planA4Pages<T>(
  items: T[],
  sizeOf: (item: T) => A4CardSize
): A4PagePlan<T>[] {
  if (items.length === 0) return [];

  const { widthMm: contentWmm, heightMm: contentHmm } = a4ContentAreaMm();
  const pages: A4PagePlan<T>[] = [];

  let rows: A4RowPlan<T>[] = [];
  let rowItems: T[] = [];
  let rowWmm = 0;
  let rowHmm = 0;

  const usedHmm = () => {
    let total = 0;
    for (let i = 0; i < rows.length; i++) {
      if (i > 0) total += A4_GAP_MM;
      total += rows[i].heightMm;
    }
    if (rowItems.length > 0) {
      if (rows.length > 0) total += A4_GAP_MM;
      total += rowHmm;
    }
    return total;
  };

  const commitRow = () => {
    if (rowItems.length === 0) return;
    rows.push({ items: [...rowItems], heightMm: rowHmm });
    rowItems = [];
    rowWmm = 0;
    rowHmm = 0;
  };

  const commitPage = () => {
    commitRow();
    if (rows.length > 0) pages.push({ rows: [...rows] });
    rows = [];
  };

  const startNewPageWith = (item: T, cardWmm: number, cardHmm: number) => {
    rowItems = [item];
    rowWmm = cardWmm;
    rowHmm = cardHmm;
  };

  for (const item of items) {
    const cardWmm = mmFromPx(sizeOf(item).widthPx);
    const cardHmm = mmFromPx(sizeOf(item).heightPx);

    const gapInRow = rowItems.length > 0 ? A4_GAP_MM : 0;
    const fitsInRow = rowWmm + gapInRow + cardWmm <= contentWmm + PAGE_FIT_EPS_MM;

    if (!fitsInRow && rowItems.length > 0) commitRow();

    if (rowItems.length === 0) {
      const gapNewRow = rows.length > 0 ? A4_GAP_MM : 0;
      const heightIfNewRow = usedHmm() + gapNewRow + cardHmm;
      if (heightIfNewRow > contentHmm + PAGE_FIT_EPS_MM && rows.length > 0) {
        commitPage();
      }
    }

    const gap = rowItems.length > 0 ? A4_GAP_MM : 0;
    const prevRowHmm = rowHmm;
    rowItems.push(item);
    rowWmm += gap + cardWmm;
    rowHmm = Math.max(rowHmm, cardHmm);

    if (usedHmm() > contentHmm + PAGE_FIT_EPS_MM) {
      rowItems.pop();
      rowWmm -= gap + cardWmm;
      rowHmm = prevRowHmm;

      commitRow();
      commitPage();
      startNewPageWith(item, cardWmm, cardHmm);
    }
  }

  commitRow();
  commitPage();
  return pages;
}

export function paginateItems<T>(items: T[], perPage: number): T[][] {
  if (items.length === 0) return [];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}

/** 미리보기 패널 너비(px)에 맞춘 A4 축소 비율 */
export function a4PreviewScale(panelWidthPx: number): number {
  const a4WidthPx = (A4_WIDTH_MM * 96) / 25.4;
  return Math.min(1, panelWidthPx / a4WidthPx);
}

export function a4SizePx() {
  return {
    width: (A4_WIDTH_MM * 96) / 25.4,
    height: (A4_HEIGHT_MM * 96) / 25.4,
  };
}
