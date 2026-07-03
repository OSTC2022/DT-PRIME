import { ProductItem } from "./types";

const CLONE_SUFFIX_RE = /-복제(\d+)$/;

/** 복제 접미사(-복제1 등)를 제외한 원본 상품명 */
export function productBaseName(name: string): string {
  return name.replace(CLONE_SUFFIX_RE, "").trimEnd();
}

export function isCloneProductName(name: string): boolean {
  return CLONE_SUFFIX_RE.test(name);
}

/** 같은 원본에서 다음 복제 번호 (복제1, 복제2, …) */
export function nextCloneNumberFromNames(names: string[], baseName: string): number {
  const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}-복제(\\d+)$`);
  let max = 0;
  for (const name of names) {
    const m = name.match(pattern);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

export function buildCloneName(names: string[], sourceName: string): string {
  const base = productBaseName(sourceName);
  const n = nextCloneNumberFromNames(names, base);
  return `${base}-복제${n}`;
}

/** @deprecated ProductItem 전용 — buildCloneName 사용 */
export function nextCloneNumber(products: ProductItem[], baseName: string): number {
  return nextCloneNumberFromNames(
    products.map((p) => p.name),
    baseName
  );
}

export function buildCloneProductName(products: ProductItem[], sourceName: string): string {
  return buildCloneName(
    products.map((p) => p.name),
    sourceName
  );
}

export function cloneProductItem(products: ProductItem[], source: ProductItem): ProductItem {
  return {
    ...source,
    id: "", // store에서 uid 부여
    name: buildCloneProductName(products, source.name),
    tags: source.tags ? [...source.tags] : undefined,
    highlightWords: source.highlightWords ? [...source.highlightWords] : undefined,
  };
}
