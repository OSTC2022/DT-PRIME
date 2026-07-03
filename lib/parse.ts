import { ProductItem } from "./types";
import { toNumber, uid } from "./utils";

export interface ParsedRow {
  name: string;
  volume: string;
  price: number;
}

// 한글 단위는 JS의 \b(단어 경계)가 동작하지 않으므로 \b를 쓰지 않는다.
// 긴 단위를 먼저 두어 부분 매칭(tab vs t)을 방지한다.
const VOLUME_RE = /(\d+(?:\.\d+)?\s*(?:ml|kg|cap|tab|매|개|정|포|캡슐|입|l|g|t|x\d+))/i;

/**
 * 한 줄을 상품명/용량/가격으로 분리한다.
 * 지원 형식:
 *   "핸드 우레아 크림 / 50ml / 15000"   (구분자 / | , \t)
 *   "핸드 우레아 크림 50ml 15000"        (공백, 용량·가격 자동 인식)
 *   "멜라 터치 크림 40,000"               (용량 없이 이름 + 가격)
 */
export function parseLine(raw: string): ParsedRow | null {
  // 천 단위 콤마(40,000)를 먼저 제거 — 콤마가 필드 구분자와 겹치는 모호함 방지
  const line = raw.replace(/(\d),(?=\d{3}\b)/g, "$1").trim();
  if (!line) return null;

  // 1) 명시적 구분자가 있으면 그걸 우선 사용
  const delim = line.split(/\s*[\/|,\t]\s*/).filter(Boolean);
  if (delim.length >= 2) {
    const priceTok = delim[delim.length - 1];
    const price = toNumber(priceTok);
    if (/\d/.test(priceTok)) {
      const middle = delim.slice(1, -1).join(" ");
      const volMatch = (middle + " " + delim[0]).match(VOLUME_RE);
      // 구분자 형식: [이름, (용량?), 가격]
      if (delim.length >= 3) {
        return { name: delim[0].trim(), volume: middle.trim(), price };
      }
      return {
        name: delim[0].trim(),
        volume: volMatch ? volMatch[1].trim() : "",
        price,
      };
    }
  }

  // 2) 공백 기반 자동 인식
  // 가격: 마지막에 등장하는 숫자(콤마 허용) 토큰
  const priceMatch = line.match(/([\d,]+)\s*원?\s*$/);
  if (!priceMatch) return null;
  const price = toNumber(priceMatch[1]);
  let rest = line.slice(0, priceMatch.index).trim();

  // 용량 추출
  const volMatch = rest.match(VOLUME_RE);
  let volume = "";
  if (volMatch) {
    volume = volMatch[1].trim();
    rest = rest.replace(volMatch[1], "").trim();
  }

  const name = rest.replace(/\s+/g, " ").trim();
  if (!name) return null;
  return { name, volume, price };
}

export function parseBulk(text: string): ParsedRow[] {
  return text
    .split(/\r?\n/)
    .map(parseLine)
    .filter((r): r is ParsedRow => r !== null);
}

export function rowsToProducts(rows: ParsedRow[]): ProductItem[] {
  return rows.map((r) => ({
    id: uid("p"),
    name: r.name,
    volume: r.volume,
    price: r.price,
    templateType: "basic",
  }));
}
