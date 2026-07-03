import { ProductItem } from "@/lib/types";
import { krw } from "@/lib/utils";

export type CardCapture = {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
};

export const EXPORT_CARDS_PER_ROW = 5;
export const EXPORT_GAP_X = 16;
export const EXPORT_GAP_Y = 18;
export const EXPORT_MARGIN = 16;

/** Excel column width (chars) ≈ pixel width */
function pxToColWidth(px: number): number {
  return Math.max(1, (px - 5) / 7);
}

/** Excel row height (points) ≈ pixel height */
function pxToRowHeight(px: number): number {
  return px * 0.75;
}

function stripDataUrl(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}

function addDataSheet(ws: import("exceljs").Worksheet, products: ProductItem[]) {
  ws.columns = [
    { header: "번호", key: "no", width: 6 },
    { header: "브랜드", key: "brand", width: 14 },
    { header: "구분", key: "category", width: 14 },
    { header: "상품명", key: "name", width: 28 },
    { header: "서브 상품명", key: "subtitle", width: 18 },
    { header: "설명", key: "description", width: 24 },
    { header: "해시태그", key: "tags", width: 24 },
    { header: "용량", key: "volume", width: 12 },
    { header: "가격", key: "price", width: 14 },
    { header: "메모", key: "memo", width: 20 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, name: "맑은 고딕" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };

  products.forEach((p, i) => {
    ws.addRow({
      no: i + 1,
      brand: p.brand ?? "",
      category: p.tab2 ?? p.category ?? "",
      name: p.name,
      subtitle: p.subtitle ?? "",
      description: p.description ?? "",
      tags: (p.tags ?? []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" "),
      volume: p.volume ?? "",
      price: krw(p.price),
      memo: p.memo ?? "",
    });
  });

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.font = { name: "맑은 고딕", size: 11 };
    });
  });

  ws.views = [{ state: "frozen", ySplit: 1, showGridLines: true }];
}

function layoutCardSheet(
  ws: import("exceljs").Worksheet,
  captures: CardCapture[]
) {
  const slotWidth = Math.max(...captures.map((c) => c.width), 220);
  const rowCount = Math.ceil(captures.length / EXPORT_CARDS_PER_ROW);

  const rowHeights: number[] = [];
  for (let r = 0; r < rowCount; r++) {
    const rowCaps = captures.slice(r * EXPORT_CARDS_PER_ROW, (r + 1) * EXPORT_CARDS_PER_ROW);
    rowHeights.push(Math.max(...rowCaps.map((c) => c.height)));
  }

  ws.getColumn(1).width = pxToColWidth(EXPORT_MARGIN);
  for (let c = 0; c < EXPORT_CARDS_PER_ROW; c++) {
    const cardCol = 2 + c * 2;
    ws.getColumn(cardCol).width = pxToColWidth(slotWidth);
    if (c < EXPORT_CARDS_PER_ROW - 1) {
      ws.getColumn(cardCol + 1).width = pxToColWidth(EXPORT_GAP_X);
    }
  }

  ws.getRow(1).height = pxToRowHeight(EXPORT_MARGIN);
  for (let r = 0; r < rowCount; r++) {
    const cardRow = 2 + r * 2;
    ws.getRow(cardRow).height = pxToRowHeight(rowHeights[r]);
    if (r < rowCount - 1) {
      ws.getRow(cardRow + 1).height = pxToRowHeight(EXPORT_GAP_Y);
    }
  }

  const bottomMarginRow = rowCount > 0 ? 2 + (rowCount - 1) * 2 + 1 : 2;
  ws.getRow(bottomMarginRow).height = pxToRowHeight(EXPORT_MARGIN);

  ws.views = [{ showGridLines: false }];

  for (let r = 1; r <= bottomMarginRow; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 2 + (EXPORT_CARDS_PER_ROW - 1) * 2; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      cell.border = {};
    }
  }
}

export async function buildProductsExcelBuffer(
  products: ProductItem[],
  captures: CardCapture[]
): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "PRICE CARD";
  wb.created = new Date();

  const cardWs = wb.addWorksheet("제품 카드", {
    properties: { defaultRowHeight: 15, showGridLines: false },
    views: [{ showGridLines: false }],
  });

  layoutCardSheet(cardWs, captures);

  const slotWidth = Math.max(...captures.map((c) => c.width), 220);

  captures.forEach((cap, index) => {
    const colIndex = index % EXPORT_CARDS_PER_ROW;
    const rowIndex = Math.floor(index / EXPORT_CARDS_PER_ROW);
    const cardCol = 2 + colIndex * 2;
    const cardRow = 2 + rowIndex * 2;

    const imageId = wb.addImage({
      base64: stripDataUrl(cap.dataUrl),
      extension: "png",
    });

    const xOffset = (slotWidth - cap.width) / 2;
    const rowCaps = captures.slice(
      rowIndex * EXPORT_CARDS_PER_ROW,
      (rowIndex + 1) * EXPORT_CARDS_PER_ROW
    );
    const rowMaxH = Math.max(...rowCaps.map((c) => c.height));
    const yOffset = (rowMaxH - cap.height) / 2;

    cardWs.addImage(imageId, {
      tl: {
        col: cardCol - 1 + xOffset / slotWidth,
        row: cardRow - 1 + yOffset / rowMaxH,
      },
      ext: { width: cap.width, height: cap.height },
    });
  });

  const dataWs = wb.addWorksheet("원본 데이터");
  addDataSheet(dataWs, products);

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export function buildExportFilename(count: number, selectedOnly: boolean): string {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = selectedOnly ? `_선택${count}개` : "";
  return `상품가격표${suffix}_${date}.xlsx`;
}
