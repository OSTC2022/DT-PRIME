"use client";

import { useMemo, useRef, useState } from "react";
import { PriceCard } from "@/components/cards/price-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PrintCardButton } from "@/components/ui/print-card-button";
import { ProductItem, ProductTemplate } from "@/lib/types";
import { CardStyleConfig } from "@/lib/template-styles";
import { PRODUCT_TEMPLATES } from "@/lib/templates";
import { buildCloneProductName } from "@/lib/product-clone";
import {
  brandSectionId,
  collectProductBrands,
  collectProductCategories,
  filterProducts,
  groupProductsByBrand,
  productBrandLabel,
  UNSPECIFIED_BRAND,
} from "@/lib/product-filter";
import { printCardById } from "@/lib/print";
import { CheckSquare, Copy, GripVertical, LayoutGrid, Rows3, Search, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CardShape = "square" | "wide";

function ProductCardTile({
  p,
  templateStyles,
  shape,
  isSel,
  onToggleSelect,
  onClone,
  onUpdate,
  onRemove,
  cardRef,
}: {
  p: ProductItem;
  templateStyles: Record<string, CardStyleConfig>;
  shape: CardShape;
  isSel: boolean;
  onToggleSelect: (id: string, options?: { multi?: boolean }) => void;
  onClone: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ProductItem>) => void;
  onRemove: (id: string) => void;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={cardRef}
      data-print-card={p.id}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.stopPropagation();
          onToggleSelect(p.id, { multi: true });
          return;
        }
        if ((e.target as HTMLElement).closest(".no-print")) return;
        printCardById(p.id);
      }}
      className={cn(
        "group relative shrink-0 cursor-pointer",
        isSel ? "ring-2 ring-primary ring-offset-2" : ""
      )}
      title="클릭하면 이 카드만 인쇄"
    >
      <div className="no-print grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 group-hover:grid-rows-[1fr]">
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-1 pb-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(p.id);
            }}
            className="rounded bg-neutral-900/80 p-1 text-white"
          >
            {isSel ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
          </button>
          <span className="cursor-grab rounded bg-neutral-900/80 p-1 text-white" title="드래그로 순서 변경">
            <GripVertical className="size-3.5" />
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClone(p.id);
            }}
            className="rounded bg-neutral-900/80 p-1 text-white"
            title="카드 복제"
          >
            <Copy className="size-3.5" />
          </button>
          <PrintCardButton cardId={p.id} />
          <select
            value={p.templateType}
            onChange={(e) => {
              e.stopPropagation();
              onUpdate(p.id, { templateType: e.target.value as ProductTemplate });
            }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[110px] rounded bg-neutral-900/80 px-1 py-0.5 text-[10px] font-bold text-white"
          >
            {PRODUCT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id} className="text-black">
                {t.label}
              </option>
            ))}
          </select>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(p.id);
            }}
            className="rounded bg-red-600/90 p-1 text-white"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <Input
          value={p.name}
          onChange={(e) => onUpdate(p.id, { name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="상품명"
          className="h-7 border-neutral-700 bg-neutral-900/90 text-[11px] font-bold text-white placeholder:text-white/50"
        />
        {(p.searchAliases?.length ?? 0) > 0 ? (
          <span className="rounded bg-neutral-900/80 px-1.5 py-0.5 text-[9px] text-white/80">
            검색어: {p.searchAliases!.join(", ")}
          </span>
        ) : null}
          </div>
        </div>
      </div>
      <div
        style={{
          width: templateStyles[p.templateType]?.width,
          height: templateStyles[p.templateType]?.height,
        }}
      >
        <PriceCard item={p} shape={shape} styleConfig={templateStyles[p.templateType]} />
      </div>
    </div>
  );
}

export function ProductCardGallery({
  products,
  templateStyles,
  shape,
  selected,
  onToggleSelect,
  onClone,
  onUpdate,
  onRemove,
  onReorder,
}: {
  products: ProductItem[];
  templateStyles: Record<string, CardStyleConfig>;
  shape: CardShape;
  selected: string[];
  onToggleSelect: (id: string, options?: { multi?: boolean }) => void;
  onClone: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ProductItem>) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilters, setBrandFilters] = useState<Set<string>>(() => new Set());
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(() => new Set());
  const [viewAll, setViewAll] = useState(false);
  const [aliasTargetId, setAliasTargetId] = useState("");
  const [drag, setDrag] = useState<number | null>(null);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const brands = useMemo(() => collectProductBrands(products), [products]);
  const categories = useMemo(() => collectProductCategories(products), [products]);

  const filtered = useMemo(
    () =>
      filterProducts(products, {
        searchQuery,
        brands: brandFilters,
        categories: categoryFilters,
      }),
    [products, searchQuery, brandFilters, categoryFilters]
  );

  /** 전체보기: 검색만 적용하고 브랜드·카테고리 필터 무시 (브랜드 미지정 포함) */
  const viewAllProducts = useMemo(
    () =>
      filterProducts(products, {
        searchQuery,
        brands: new Set(),
        categories: new Set(),
      }),
    [products, searchQuery]
  );

  const displayProducts = viewAll ? viewAllProducts : filtered;

  const brandGroups = useMemo(
    () => groupProductsByBrand(displayProducts),
    [displayProducts]
  );

  const headlineBrands = useMemo(() => {
    if (viewAll) return brandGroups.map((g) => g.brand);
    const set = new Set<string>();
    for (const p of filtered) {
      set.add(productBrandLabel(p));
    }
    return Array.from(set).sort((a, b) => {
      if (a === UNSPECIFIED_BRAND) return 1;
      if (b === UNSPECIFIED_BRAND) return -1;
      return a.localeCompare(b, "ko");
    });
  }, [filtered, viewAll, brandGroups]);

  const toggleBrand = (brand: string) => {
    setBrandFilters((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setCategoryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const scrollToBrand = (brand: string) => {
    if (viewAll) {
      document.getElementById(brandSectionId(brand))?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const first = displayProducts.find((p) => productBrandLabel(p) === brand);
    if (!first) return;
    const el = cardRefs.current.get(first.id);
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  const addSearchAlias = () => {
    const q = searchQuery.trim();
    if (!q) {
      toast.error("검색어를 입력해 주세요.");
      return;
    }
    if (!aliasTargetId) {
      toast.error("검색어를 연결할 가격표를 선택해 주세요.");
      return;
    }
    const target = products.find((p) => p.id === aliasTargetId);
    if (!target) return;
    const existing = target.searchAliases ?? [];
    if (existing.some((a) => a.toLowerCase() === q.toLowerCase())) {
      toast.message("이미 등록된 검색어예요.");
      return;
    }
    onUpdate(aliasTargetId, { searchAliases: [...existing, q] });
    toast.success(`"${target.name}"에 검색어 「${q}」를 추가했어요.`);
    setAliasTargetId("");
  };

  const renderCard = (p: ProductItem) => (
    <div
      key={p.id}
      draggable
      className="shrink-0 self-start"
      onDragStart={() => setDrag(products.findIndex((x) => x.id === p.id))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        const to = products.findIndex((x) => x.id === p.id);
        if (drag !== null && drag !== to) onReorder(drag, to);
        setDrag(null);
      }}
    >
      <ProductCardTile
        p={p}
        templateStyles={templateStyles}
        shape={shape}
        isSel={selected.includes(p.id)}
        onToggleSelect={onToggleSelect}
        onClone={onClone}
        onUpdate={onUpdate}
        onRemove={onRemove}
        cardRef={(el) => {
          if (el) cardRefs.current.set(p.id, el);
          else cardRefs.current.delete(p.id);
        }}
      />
    </div>
  );

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-16 text-center text-muted-foreground">
        왼쪽에서 상품을 추가하면 여기에 카드가 나타납니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 검색 */}
      <div className="no-print rounded-lg border bg-muted/20 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="상품명 · 브랜드 · 카테고리 · 추가 검색어"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        {searchQuery.trim() && filtered.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed bg-background p-3">
            <p className="text-sm font-bold text-muted-foreground">「{searchQuery}」 검색 결과가 없어요.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              가격표를 선택하고 검색어를 추가하면, 다음부터 이 단어로도 찾을 수 있습니다.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Select
                value={aliasTargetId}
                onChange={(e) => setAliasTargetId(e.target.value)}
                className="h-9 min-w-[160px] flex-1"
              >
                <option value="">가격표 선택…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.brand ? ` · ${p.brand}` : ""}
                  </option>
                ))}
              </Select>
              <Button type="button" size="sm" onClick={addSearchAlias}>
                검색어 추가
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* 브랜드 · 카테고리 필터 */}
      <div className="no-print space-y-2 rounded-lg border bg-background p-3">
        {brands.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black text-muted-foreground">브랜드</span>
            {brands.map((b) => (
              <label
                key={b}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                  brandFilters.has(b) ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-primary"
                  checked={brandFilters.has(b)}
                  onChange={() => toggleBrand(b)}
                />
                {b}
              </label>
            ))}
            {brandFilters.size > 0 ? (
              <button
                type="button"
                className="text-[10px] text-muted-foreground underline"
                onClick={() => setBrandFilters(new Set())}
              >
                전체
              </button>
            ) : null}
          </div>
        ) : null}
        {categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black text-muted-foreground">카테고리</span>
            {categories.map((c) => (
              <label
                key={c}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                  categoryFilters.has(c) ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <input
                  type="checkbox"
                  className="size-3.5 accent-primary"
                  checked={categoryFilters.has(c)}
                  onChange={() => toggleCategory(c)}
                />
                {c}
              </label>
            ))}
            {categoryFilters.size > 0 ? (
              <button
                type="button"
                className="text-[10px] text-muted-foreground underline"
                onClick={() => setCategoryFilters(new Set())}
              >
                전체
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 헤드라인 · 전체보기 */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{displayProducts.length}개 표시</Badge>
        <Button
          type="button"
          variant={viewAll ? "default" : "outline"}
          size="sm"
          className="h-8"
          onClick={() => setViewAll((v) => !v)}
        >
          {viewAll ? <Rows3 className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
          {viewAll ? "슬라이드 보기" : "전체보기"}
        </Button>
        {viewAll ? (
          <span className="text-[10px] text-muted-foreground">브랜드 미지정 포함 · 전체 브랜드 표시</span>
        ) : null}
        {headlineBrands.length > (viewAll ? 0 : 1) ? (
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto border-l pl-2">
            {headlineBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => scrollToBrand(brand)}
                className="shrink-0 rounded-full border bg-background px-3 py-1 text-[11px] font-bold hover:border-primary hover:text-primary"
              >
                {brand}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {displayProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          조건에 맞는 카드가 없어요. 필터를 바꾸거나 검색어를 추가해 보세요.
        </div>
      ) : viewAll ? (
        <div className="grid-paper space-y-6 rounded-lg border p-4">
          {brandGroups.map((g) => (
            <section key={g.brand} id={brandSectionId(g.brand)}>
              <h3 className="mb-3 border-b pb-2 text-sm font-black">{g.brand}</h3>
              <div className="flex items-start gap-4 overflow-x-auto overflow-y-visible pb-2 pt-1">
                {g.items.map((p) => renderCard(p))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid-paper rounded-lg border p-4 pt-3">
          <div className="flex items-start gap-4 overflow-x-auto overflow-y-visible pb-2 pt-1">
            {filtered.map((p) => renderCard(p))}
          </div>
        </div>
      )}
    </div>
  );
}
