"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "@/components/products/product-form";
import { BulkPaste } from "@/components/products/bulk-paste";
import { DownloadBar } from "@/components/products/download-bar";
import { ProductCardGallery } from "@/components/products/product-card-gallery";
import { TemplatePresetPicker } from "@/components/templates/template-preset-picker";
import { buildCloneProductName } from "@/lib/product-clone";
import { useMounted } from "@/lib/use-mounted";
import { CheckSquare, Square, Trash2, ArrowDownAZ } from "lucide-react";
import { toast } from "sonner";

export default function ProductsPage() {
  const products = useStore((s) => s.products);
  const templateStyles = useStore((s) => s.templateStyles);
  const selected = useStore((s) => s.selectedProductIds);
  const {
    toggleSelect,
    selectAll,
    removeSelected,
    resetProductOrder,
    cloneProductAfter,
    updateProduct,
    removeProduct,
    reorderProducts,
  } = useStore();

  const [tab, setTab] = useState("single");
  const [shape, setShape] = useState<"square" | "wide">("square");

  const mounted = useMounted();
  const allSelected = products.length > 0 && selected.length === products.length;

  if (!mounted) return <div className="p-5 text-muted-foreground">불러오는 중…</div>;

  return (
    <div className="grid grid-cols-1 gap-0 lg:grid-cols-[420px_1fr]">
      <section className="no-print border-b p-5 lg:border-b-0 lg:border-r">
        <h1 className="text-lg font-black">상품 가격표</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          입력하면 오른쪽에 카드가 자동으로 만들어집니다. 카드를 클릭하면 해당 카드만 인쇄됩니다.
          Ctrl+클릭(⌘+클릭)으로 여러 카드를 선택한 뒤 엑셀로보낼 수 있습니다.
        </p>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="single">단일 입력</TabsTrigger>
            <TabsTrigger value="bulk">대량 붙여넣기</TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <ProductForm />
          </TabsContent>
          <TabsContent value="bulk">
            <BulkPaste />
          </TabsContent>
        </Tabs>
      </section>

      <section className="print-area p-5">
        <div className="no-print mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">총 {products.length}개</Badge>
          <Button variant="ghost" size="sm" onClick={() => selectAll(!allSelected)}>
            {allSelected ? <CheckSquare /> : <Square />} 전체 선택
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!selected.length}
            onClick={() => {
              removeSelected();
              toast.success("선택한 카드를 삭제했어요.");
            }}
          >
            <Trash2 /> 선택 삭제 {selected.length ? `(${selected.length})` : ""}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetProductOrder}>
            <ArrowDownAZ /> 순서 초기화
          </Button>

          <div className="ml-auto">
            <Select value={shape} onChange={(e) => setShape(e.target.value as "square" | "wide")} className="h-9 w-28">
              <option value="square">정사각형</option>
              <option value="wide">가로형</option>
            </Select>
          </div>
          <div className="w-full space-y-3">
            <TemplatePresetPicker showAllPresets className="rounded-lg border bg-muted/20 p-3" />
            <DownloadBar
              products={products}
              selectedIds={selected.length ? selected : undefined}
              templateStyles={templateStyles}
              shape={shape}
            />
          </div>
        </div>

        <ProductCardGallery
          products={products}
          templateStyles={templateStyles}
          shape={shape}
          selected={selected}
          onToggleSelect={toggleSelect}
          onClone={(id) => {
            const p = products.find((x) => x.id === id);
            const cloneName = p ? buildCloneProductName(products, p.name) : "";
            cloneProductAfter(id);
            if (cloneName) toast.success(`"${cloneName}" 카드를 아래에 추가했어요.`);
          }}
          onUpdate={updateProduct}
          onRemove={removeProduct}
          onReorder={reorderProducts}
        />
      </section>
    </div>
  );
}
