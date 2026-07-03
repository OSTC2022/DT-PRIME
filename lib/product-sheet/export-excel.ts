import {
  EXCEL_COL_WIDTH,
  EXCEL_ROW_HEIGHT,
  SHEET_CELL_HEIGHT,
  SHEET_CELL_WIDTH,
  ProductSheetCardData,
} from "./types";

export type SheetCardCapture = {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
};

export const SHEET_EXPORT_CARDS_PER_ROW = 3;

function stripDataUrl(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}

function addDataSheet(ws: import("exceljs").Worksheet, cards: ProductSheetCardData[]) {
  ws.columns = [
    { header: "번호", key: "no", width: 6 },
    { header: "브랜드", key: "brand", width: 16 },
    { header: "구분", key: "category", width: 14 },
    { header: "상품명", key: "title", width: 24 },
    { header: "강조 키워드", key: "highlight", width: 18 },
    { header: "해시태그", key: "tags", width: 28 },
    { header: "용량", key: "bottom", width: 16 },
    { header: "가격", key: "price", width: 16 },
    { header: "색상", key: "color", width: 12 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, name: "맑은 고딕" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };

  cards.forEach((card, i) => {
    ws.addRow({
      no: i + 1,
      brand: card.brand,
      category: card.line ?? "",
      title: card.title,
      highlight: card.highlight ?? "",
      tags: (card.tags ?? []).join(" "),
      bottom: card.bottom ?? "",
      price: card.price ?? "",
      color: card.color ?? "",
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

/** 엑셀 열28·행125.25 기준 3열 카드 그리드 */
function layoutCardSheet(ws: import("exceljs").Worksheet, rowCount: number) {
  for (let c = 0; c < SHEET_EXPORT_CARDS_PER_ROW; c++) {
    ws.getColumn(c + 1).width = EXCEL_COL_WIDTH;
  }

  for (let r = 0; r < rowCount; r++) {
    ws.getRow(r + 1).height = EXCEL_ROW_HEIGHT;
  }

  ws.views = [{ showGridLines: false }];

  for (let r = 1; r <= rowCount; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= SHEET_EXPORT_CARDS_PER_ROW; c++) {
      row.getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
    }
  }
}

export async function buildProductSheetExcelBuffer(
  cards: ProductSheetCardData[],
  captures: SheetCardCapture[]
): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "PRICE CARD";
  wb.created = new Date();

  const rowCount = Math.ceil(captures.length / SHEET_EXPORT_CARDS_PER_ROW);

  const cardWs = wb.addWorksheet("제품 카드", {
    properties: { defaultRowHeight: EXCEL_ROW_HEIGHT, showGridLines: false },
    views: [{ showGridLines: false }],
  });

  layoutCardSheet(cardWs, rowCount);

  const cellWidthPx = SHEET_CELL_WIDTH;
  const cellHeightPx = SHEET_CELL_HEIGHT;

  captures.forEach((cap, index) => {
    const colIndex = index % SHEET_EXPORT_CARDS_PER_ROW;
    const rowIndex = Math.floor(index / SHEET_EXPORT_CARDS_PER_ROW);

    const imageId = wb.addImage({
      base64: stripDataUrl(cap.dataUrl),
      extension: "png",
    });

    const xOffset = (cellWidthPx - cap.width) / 2 / cellWidthPx;
    const yOffset = (cellHeightPx - cap.height) / 2 / cellHeightPx;

    cardWs.addImage(imageId, {
      tl: {
        col: colIndex + xOffset,
        row: rowIndex + yOffset,
      },
      ext: { width: cap.width, height: cap.height },
    });
  });

  const dataWs = wb.addWorksheet("원본 데이터");
  addDataSheet(dataWs, cards);

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export function buildSheetExportFilename(count: number, selectedOnly: boolean): string {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = selectedOnly ? `_선택${count}개` : "";
  return `제품관리카드시트${suffix}_${date}.xlsx`;
}

/** @deprecated 이미지 캡처 방식으로 대체됨 */
export async function downloadProductSheetExcel(
  _allCards: ProductSheetCardData[],
  _options?: { onlyIds?: Set<string>; style?: unknown; filename?: string }
): Promise<void> {
  throw new Error("use-capture-export");
}
