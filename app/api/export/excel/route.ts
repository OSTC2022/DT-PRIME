import { NextResponse } from "next/server";

/**
 * 사양서 9번: 엑셀 다운로드 API route 자리.
 *
 * 지금은 501(준비 중)을 반환한다.
 * 추후 Cursor에서 ExcelJS를 설치하고 아래 주석을 구현하면 된다.
 *
 *   import ExcelJS from "exceljs";
 *   export async function POST(req: Request) {
 *     const { products } = await req.json();
 *     const wb = new ExcelJS.Workbook();
 *     const ws = wb.addWorksheet("제품목록");
 *     ws.columns = [
 *       { header: "상품명", key: "name", width: 26 },
 *       { header: "용량", key: "volume", width: 12 },
 *       { header: "가격", key: "price", width: 12 },
 *       { header: "카테고리", key: "category", width: 14 },
 *     ];
 *     products.forEach((p) => ws.addRow(p));
 *     const buf = await wb.xlsx.writeBuffer();
 *     return new NextResponse(buf, {
 *       headers: {
 *         "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 *         "Content-Disposition": `attachment; filename="products.xlsx"`,
 *       },
 *     });
 *   }
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, message: "엑셀 내보내기 기능은 연결 준비 중입니다. (ExcelJS 구현 예정)" },
    { status: 501 }
  );
}
