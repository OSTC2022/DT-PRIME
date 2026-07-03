"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BankCardView } from "@/components/cards/bank-card";
import { DownloadBar } from "@/components/products/download-bar";
import { PrintCardButton } from "@/components/ui/print-card-button";
import { printCardById } from "@/lib/print";
import { Plus, Trash2 } from "lucide-react";
import { DEFAULT_BANK_CARD_DEMO, BankCardDemoData } from "@/lib/bank-card-demos";
import { useMounted } from "@/lib/use-mounted";
import { toast } from "sonner";

function styleFromDemo(d: BankCardDemoData) {
  return {
    width: d.width,
    height: d.height,
    logoFontSize: d.logoFontSize,
    logoColor: d.logoColor,
    infoFontSize: d.infoFontSize,
    infoColor: d.infoColor,
    noticeFontSize: d.noticeFontSize,
    noticeColor: d.noticeColor,
    noticeBgColor: d.noticeBgColor,
    backgroundColor: d.backgroundColor,
    borderColor: d.borderColor,
    borderWidth: d.borderWidth,
    borderRadius: d.borderRadius,
    padding: d.padding,
  };
}

export default function BankCardsPage() {
  const cards = useStore((s) => s.bankCards);
  const bankCardDemo = useStore((s) => s.bankCardDemo);
  const { addBankCard, removeBankCard } = useStore();

  const [f, setF] = useState({ ...DEFAULT_BANK_CARD_DEMO });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const mounted = useMounted();
  useEffect(() => {
    if (mounted) setF({ ...bankCardDemo });
  }, [mounted, bankCardDemo]);
  if (!mounted) return <div className="p-5 text-muted-foreground">불러오는 중…</div>;

  const submit = () => {
    if (!f.bankName.trim() || !f.accountNumber.trim()) {
      toast.error("은행명과 계좌번호를 입력해 주세요.");
      return;
    }
    addBankCard({ ...f, ...styleFromDemo(bankCardDemo) });
    toast.success("계좌 카드를 추가했어요.");
    setF({ ...bankCardDemo, accountNumber: "", accountHolder: "" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]">
      <section className="no-print border-b p-5 lg:border-b-0 lg:border-r">
        <h1 className="text-lg font-black">계좌 안내 카드</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          인쇄해서 붙이기 좋은 계좌 안내 카드를 만듭니다. 기본 문구는 카드 템플릿 관리에서 수정할 수 있습니다.
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>상단 로고 텍스트</Label>
            <Input value={f.logoText} onChange={(e) => set("logoText", e.target.value)} placeholder="동큰+" />
          </div>
          <div className="space-y-1.5">
            <Label>은행명</Label>
            <Input value={f.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="경남은행" />
          </div>
          <div className="space-y-1.5">
            <Label>계좌번호</Label>
            <Input value={f.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder="9216-9214" />
          </div>
          <div className="space-y-1.5">
            <Label>예금주</Label>
            <Input value={f.accountHolder} onChange={(e) => set("accountHolder", e.target.value)} placeholder="최태환" />
          </div>
          <div className="space-y-1.5">
            <Label>하단 안내 문구</Label>
            <Input value={f.noticeText} onChange={(e) => set("noticeText", e.target.value)} placeholder="이체 후 직원에게 꼭 말씀해 주세요!" />
          </div>
          <Button onClick={submit} size="lg" className="w-full">
            <Plus /> 계좌 카드 추가
          </Button>
        </div>
      </section>

      <section className="print-area p-5">
        <div className="no-print mb-4 flex items-center gap-2">
          <Badge variant="secondary">총 {cards.length}개</Badge>
          <div className="ml-auto"><DownloadBar /></div>
        </div>
        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center text-muted-foreground">
            왼쪽에서 계좌 정보를 입력하면 카드가 나타납니다.
          </div>
        ) : (
          <div className="grid-paper grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
            {cards.map((c) => (
              <div
                key={c.id}
                data-print-card={c.id}
                className="group relative cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest(".no-print")) return;
                  printCardById(c.id);
                }}
                title="클릭하면 이 카드만 인쇄"
              >
                <div className="no-print absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <PrintCardButton cardId={c.id} />
                  <button
                    onClick={() => removeBankCard(c.id)}
                    className="rounded bg-red-600/90 p-1 text-white"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <BankCardView card={c} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
