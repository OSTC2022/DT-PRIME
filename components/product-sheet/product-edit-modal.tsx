"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SHEET_COLOR_THEMES } from "@/lib/product-sheet/colors";
import { ProductSheetCardData, SheetColorKey } from "@/lib/product-sheet/types";
import { cn } from "@/lib/utils";

export function ProductEditModal({
  card,
  open,
  onClose,
  onSave,
}: {
  card: ProductSheetCardData | null;
  open: boolean;
  onClose: () => void;
  onSave: (patch: Partial<ProductSheetCardData>) => void;
}) {
  if (!open || !card) return null;

  const tagsText = (card.tags ?? []).join("\n");

  const saveField = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const tags = String(fd.get("tags") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    onSave({
      brand: String(fd.get("brand") ?? ""),
      line: String(fd.get("line") ?? "") || undefined,
      title: String(fd.get("title") ?? ""),
      highlight: String(fd.get("highlight") ?? "") || undefined,
      tags,
      bottom: String(fd.get("bottom") ?? "") || undefined,
      price: String(fd.get("price") ?? "") || undefined,
      color: (String(fd.get("color") ?? "repair") || "repair") as SheetColorKey,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="닫기" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-4 shadow-lg"
        )}
      >
        <h3 className="text-sm font-black">카드 수정</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">변경 내용은 브라우저에 저장됩니다.</p>

        <form
          key={card.id}
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveField(e.currentTarget);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="브랜드명">
              <Input name="brand" defaultValue={card.brand} className="h-9" />
            </Field>
            <Field label="라인명">
              <Input name="line" defaultValue={card.line ?? ""} className="h-9" placeholder="바이오" />
            </Field>
          </div>
          <Field label="제품명 / 카테고리">
            <Input name="title" defaultValue={card.title} className="h-9" />
          </Field>
          <Field label="강조 문구">
            <Input name="highlight" defaultValue={card.highlight ?? ""} className="h-9" placeholder="리페어 크림" />
          </Field>
          <Field label="색상 계열">
            <Select name="color" defaultValue={card.color ?? "repair"} className="h-9">
              {Object.entries(SHEET_COLOR_THEMES).map(([key, theme]) => (
                <option key={key} value={key}>
                  {theme.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="해시태그 (엔터로 줄바꿈)">
            <Textarea name="tags" defaultValue={tagsText} rows={4} className="text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="용량">
              <Input name="bottom" defaultValue={card.bottom ?? ""} className="h-9" placeholder="50ml / 250ml" />
            </Field>
            <Field label="가격">
              <Input name="price" defaultValue={card.price ?? ""} className="h-9" placeholder="35,000원" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" size="sm">
              저장
            </Button>
          </div>
        </form>
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
