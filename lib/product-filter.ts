import { ProductItem } from "./types";

export const UNSPECIFIED_BRAND = "브랜드 미지정";

export function productBrandLabel(p: ProductItem): string {
  return p.brand?.trim() || UNSPECIFIED_BRAND;
}

export function productSearchHaystack(p: ProductItem): string {
  return [
    p.name,
    p.brand,
    p.category,
    p.memo,
    p.volume,
    ...(p.tags ?? []),
    ...(p.searchAliases ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function productMatchesSearch(p: ProductItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return productSearchHaystack(p).includes(q);
}

export function collectProductBrands(products: ProductItem[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    set.add(productBrandLabel(p));
  }
  return Array.from(set).sort((a, b) => {
    if (a === UNSPECIFIED_BRAND) return 1;
    if (b === UNSPECIFIED_BRAND) return -1;
    return a.localeCompare(b, "ko");
  });
}

export function collectProductCategories(products: ProductItem[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const c = p.category?.trim();
    if (c) set.add(c);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

export function filterProducts(
  products: ProductItem[],
  opts: {
    searchQuery: string;
    brands: Set<string>;
    categories: Set<string>;
  }
): ProductItem[] {
  return products.filter((p) => {
    if (!productMatchesSearch(p, opts.searchQuery)) return false;
    if (opts.brands.size > 0) {
      if (!opts.brands.has(productBrandLabel(p))) return false;
    }
    if (opts.categories.size > 0) {
      const c = p.category?.trim() || "";
      if (!opts.categories.has(c)) return false;
    }
    return true;
  });
}

export function groupProductsByBrand(products: ProductItem[]): { brand: string; items: ProductItem[] }[] {
  const map = new Map<string, ProductItem[]>();
  for (const p of products) {
    const brand = productBrandLabel(p);
    const list = map.get(brand) ?? [];
    list.push(p);
    map.set(brand, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === UNSPECIFIED_BRAND) return 1;
      if (b === UNSPECIFIED_BRAND) return -1;
      return a.localeCompare(b, "ko");
    })
    .map(([brand, items]) => ({ brand, items }));
}

export function brandSectionId(brand: string): string {
  return `brand-${brand.replace(/\s+/g, "-")}`;
}
