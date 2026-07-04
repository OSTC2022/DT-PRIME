"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-sheet/product-card";
import { SheetCardPreviewFrame } from "@/components/product-sheet/sheet-card-preview-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SHEET_COLOR_THEMES } from "@/lib/product-sheet/colors";
import { ProductSheetStyleConfig } from "@/lib/product-sheet/styles";
import { ProductSheetCardData, SheetColorKey } from "@/lib/product-sheet/types";
import { Layers } from "lucide-react";
import { toast } from "sonner";

const MIXED = "__mixed__";

function commonField(
  cards: ProductSheetCardData[],
  read: (c: ProductSheetCardData) => string | undefined
): string {
  if (cards.length === 0) return "";
  const first = read(cards[0]) ?? "";
  return cards.every((c) => (read(c) ?? "") === first) ? first : MIXED;
}

export function ProductSheetSelectedBatchEditor({
  cards,
  style,
  onApply,
}: {
  cards: ProductSheetCardData[];
  style: ProductSheetStyleConfig;
  onApply: (patch: Partial<ProductSheetCardData>) => void;
}) {
  const [brand, setBrand] = useState("");
  const [line, setLine] = useState("");
  const [title, setTitle] = useState("");
  const [highlight, setHighlight] = useState("");
  const [color, setColor] = useState<string>("");
  const [tagsText, setTagsText] = useState("");
  const [bottom, setBottom] = useState("");
  const [price, setPrice] = useState("");

  const previewCard = cards[0];

  useEffect(() => {
    setBrand(commonField(cards, (c) => c.brand));
    setLine(commonField(cards, (c) => c.line));
    setTitle(commonField(cards, (c) => c.title));
    setHighlight(commonField(cards, (c) => c.highlight));
    const colors = cards.map((c) => c.color ?? "repair");
    setColor(colors.every((v) => v === colors[0]) ? colors[0] : MIXED);
    const tags = cards.map((c) => (c.tags ?? []).join("\n"));
    setTagsText(tags.every((t) => t === tags[0]) ? tags[0] : "");
    setBottom(commonField(cards, (c) => c.bottom));
    setPrice(commonField(cards, (c) => c.price));
  }, [cards]);

  const previewDraft = useMemo((): ProductSheetCardData => {
    if (!previewCard) return cards[0]!;
    return {
      ...previewCard,
      brand: brand === MIXED ? previewCard.brand : brand,
      line: line === MIXED ? previewCard.line : line || undefined,
      title: title === MIXED ? previewCard.title : title,
      highlight: highlight === MIXED ? previewCard.highlight : highlight || undefined,
      color: color === MIXED || !color ? previewCard.color : (color as SheetColorKey),
      tags:
        tagsText === "" && cards.some((c) => (c.tags ?? []).join("\n") !== (cards[0].tags ?? []).join("\n"))
          ? previewCard.tags
          : tagsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
      bottom: bottom === MIXED ? previewCard.bottom : bottom || undefined,
      price: price === MIXED ? previewCard.price : price || undefined,
    };
  }, [previewCard, cards, brand, line, title, highlight, color, tagsText, bottom, price]);

  const buildPatch = (): Partial<ProductSheetCardData> | null => {
    const patch: Partial<ProductSheetCardData> = {};
    if (brand !== MIXED) patch.brand = brand;
    if (line !== MIXED) patch.line = line.trim() || undefined;
    if (title !== MIXED) patch.title = title;
    if (highlight !== MIXED) patch.highlight = highlight.trim() || undefined;
    if (color && color !== MIXED) patch.color = color as SheetColorKey;
    if (tagsText !== "" || cards.every((c) => (c.tags ?? []).join("\n") === tagsText)) {
      patch.tags = tagsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (bottom !== MIXED) patch.bottom = bottom.trim() || undefined;
    if (price !== MIXED) patch.price = price.trim() || undefined;
    return Object.keys(patch).length > 0 ? patch : null;
  };

  const handleApply = () => {
    const patch = buildPatch();
    if (!patch) {
      toast.message("변경할 내용을 입력해 주세요.");
      return;
    }
    onApply(patch);
    toast.success(`선택한 ${cards.length}개 카드에 적용했어요.`);
  };

  if (cards.length === 0) return null;

  return (
    <div id="sheet-selected-batch-editor" className="rounded-xl border-2 border-primary/25 bg-white">
      <div className="border-b bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-primary" />
          <div>
            <h3 className="font-black">선택 일괄 편집</h3>
            <p className="text-xs text-muted-foreground">
              선택한 {cards.length}개 카드에 동일한 내용을 한 번에 적용합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[auto_1fr]">
        <div className="grid-paper rounded-lg border p-3">
          <p className="mb-2 text-[11px] font-bold text-muted-foreground">미리보기 (첫 번째 카드)</p>
          <SheetCardPreviewFrame style={style}>
            <ProductCard {...previewDraft} styleConfig={style} interactive={false} />
          </SheetCardPreviewFrame>
          <ul className="mt-3 max-h-28 space-y-0.5 overflow-y-auto text-[10px] text-muted-foreground">
            {cards.map((c) => (
              <li key={c.id} className="truncate">
                · {c.brand} — {c.title}
                {c.highlight ? ` (${c.highlight})` : ""}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            값이 서로 다른 항목은 「여러 값」으로 표시됩니다. 입력 후 적용하면 선택한 카드 모두에 반영됩니다.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Field label="브랜드명">
              <Input
                value={brand === MIXED ? "" : brand}
                placeholder={brand === MIXED ? "여러 값" : ""}
                onChange={(e) => setBrand(e.target.value)}
                className="h-9"
              />
            </Field>
            <Field label="라인명">
              <Input
                value={line === MIXED ? "" : line}
                placeholder={line === MIXED ? "여러 값" : "바이오"}
                onChange={(e) => setLine(e.target.value)}
                className="h-9"
              />
            </Field>
          </div>

          <Field label="제품명 / 카테고리">
            <Input
              value={title === MIXED ? "" : title}
              placeholder={title === MIXED ? "여러 값" : ""}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9"
            />
          </Field>

          <Field label="강조 문구">
            <Input
              value={highlight === MIXED ? "" : highlight}
              placeholder={highlight === MIXED ? "여러 값" : ""}
              onChange={(e) => setHighlight(e.target.value)}
              className="h-9"
            />
          </Field>

          <Field label="색상 계열">
            <Select
              value={color === MIXED ? "" : color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9"
            >
              {color === MIXED ? <option value="">여러 값 — 선택하여 통일</option> : null}
              {Object.entries(SHEET_COLOR_THEMES).map(([key, theme]) => (
                <option key={key} value={key}>
                  {theme.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="해시태그 (엔터로 줄바꿈)">
            <Textarea
              value={tagsText}
              placeholder={
                cards.some(
                  (c, i, arr) =>
                    (c.tags ?? []).join("\n") !== (arr[0].tags ?? []).join("\n")
                )
                  ? "여러 값 — 입력하면 모두 동일하게 적용"
                  : ""
              }
              onChange={(e) => setTagsText(e.target.value)}
              rows={4}
              className="text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="용량">
              <Input
                value={bottom === MIXED ? "" : bottom}
                placeholder={bottom === MIXED ? "여러 값" : "30ml / 100ml · 두 줄은 //"}
                onChange={(e) => setBottom(e.target.value)}
                className="h-9"
              />
            </Field>
            <Field label="가격">
              <Input
                value={price === MIXED ? "" : price}
                placeholder={price === MIXED ? "여러 값" : "48,000원 / 70,000원 · 두 줄은 //"}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9"
              />
            </Field>
          </div>

          <Button type="button" onClick={handleApply} className="w-full sm:w-auto">
            선택 {cards.length}개에 적용
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px]">{label}</Label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
