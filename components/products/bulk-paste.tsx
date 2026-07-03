"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseBulk, rowsToProducts } from "@/lib/parse";
import { useStore } from "@/lib/store";
import { Wand2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EditableRow {
  name: string;
  volume: string;
  price: number;
}

const PLACEHOLDER = `핸드 우레아 크림 / 50ml / 15000
멜라 터치 크림 / 35ml / 40000
페이셜 리페어 크림 / 50ml / 25000
PDRN 앰플 30ml 35000`;

export function BulkPaste() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<EditableRow[] | null>(null);
  const addProducts = useStore((s) => s.addProducts);

  const split = () => {
    const parsed = parseBulk(text);
    if (!parsed.length) {
      toast.error("분리할 항목을 찾지 못했어요.", { description: "예: 상품명 / 용량 / 가격" });
      return;
    }
    setRows(parsed);
    toast.success(`${parsed.length}개 항목으로 분리했어요. 표에서 확인·수정하세요.`);
  };

  const update = (i: number, key: keyof EditableRow, value: string) => {
    setRows((prev) =>
      prev!.map((r, idx) =>
        idx === i ? { ...r, [key]: key === "price" ? value.replace(/[^0-9]/g, "") : value } : r
      )
    );
  };

  const removeRow = (i: number) => setRows((prev) => prev!.filter((_, idx) => idx !== i));

  const create = () => {
    if (!rows?.length) return;
    const clean = rows
      .filter((r) => r.name.trim())
      .map((r) => ({ name: r.name.trim(), volume: r.volume.trim(), price: Number(r.price) || 0 }));
    addProducts(rowsToProducts(clean));
    toast.success(`${clean.length}개 카드를 생성했어요.`);
    setRows(null);
    setText("");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          엑셀에서 복사한 내용을 그대로 붙여넣으세요. <code>/</code>, 쉼표, 탭, 띄어쓰기 모두 자동 인식합니다.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          className="min-h-[140px] font-mono text-sm"
        />
        <div className="mt-2">
          <Button onClick={split} variant="outline">
            <Wand2 /> 자동 분리
          </Button>
        </div>
      </div>

      {rows && (
        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_120px_120px_40px] gap-px border-b bg-muted/60 text-xs font-bold text-muted-foreground">
            <div className="px-3 py-2">상품명</div>
            <div className="px-3 py-2">용량</div>
            <div className="px-3 py-2">가격</div>
            <div className="px-2 py-2" />
          </div>
          <div className="max-h-72 overflow-auto">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_120px_40px] items-center gap-px border-b last:border-0">
                <div className="p-1">
                  <Input className="h-9" value={r.name} onChange={(e) => update(i, "name", e.target.value)} />
                </div>
                <div className="p-1">
                  <Input className="h-9" value={r.volume} onChange={(e) => update(i, "volume", e.target.value)} />
                </div>
                <div className="p-1">
                  <Input className="h-9" inputMode="numeric" value={String(r.price)} onChange={(e) => update(i, "price", e.target.value)} />
                </div>
                <div className="flex justify-center">
                  <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2">
            <span className="text-sm text-muted-foreground">{rows.length}개 항목</span>
            <Button onClick={create}>
              <Plus /> 카드 생성
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
