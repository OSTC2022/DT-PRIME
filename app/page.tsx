"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TemplatePresetPicker } from "@/components/templates/template-preset-picker";
import { PriceCard } from "@/components/cards/price-card";
import { Tag, MessageSquareText, Landmark, RotateCcw, Trash2 } from "lucide-react";
import { krw } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { toast } from "sonner";

export default function Dashboard() {
  const products = useStore((s) => s.products);
  const templateStyles = useStore((s) => s.templateStyles);
  const textCards = useStore((s) => s.textCards);
  const bankCards = useStore((s) => s.bankCards);
  const loadSamples = useStore((s) => s.loadSamples);
  const clearAll = useStore((s) => s.clearAll);

  const mounted = useMounted();
  if (!mounted) return <div className="p-5 text-muted-foreground">불러오는 중…</div>;

  const total = products.reduce((sum, p) => sum + (p.price || 0), 0);

  const stats = [
    { label: "상품 가격표", value: `${products.length}개`, href: "/products", icon: Tag },
    { label: "안내 문구 카드", value: `${textCards.length}개`, href: "/text-cards", icon: MessageSquareText },
    { label: "계좌 안내 카드", value: `${bankCards.length}개`, href: "/bank-cards", icon: Landmark },
  ];

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">대시보드</h1>
          <p className="text-sm text-muted-foreground">등록된 카드 현황과 바로가기</p>
        </div>
        <div className="no-print flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { loadSamples(); toast.success("샘플 데이터를 불러왔어요."); }}>
            <RotateCcw /> 샘플 불러오기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("모든 데이터를 삭제할까요?")) { clearAll(); toast.success("전체 삭제했어요."); }
            }}
          >
            <Trash2 /> 전체 비우기
          </Button>
        </div>
      </div>

      <div className="no-print mb-6 max-w-xl">
        <TemplatePresetPicker showAllPresets />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition hover:border-primary hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="rounded-lg bg-accent p-3">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                    <div className="text-2xl font-black">{s.value}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-accent p-3">
              <Tag className="size-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">상품 가격 합계</div>
              <div className="text-2xl font-black text-brand-red">{krw(total)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black">최근 상품 카드</h2>
          <Link href="/products" className="text-sm font-bold text-primary hover:underline">전체 보기 →</Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            아직 카드가 없어요. 샘플을 불러오거나 상품을 추가해 보세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {products.slice(0, 5).map((p) => (
              <div
                key={p.id}
                style={{
                  width: templateStyles[p.templateType]?.width,
                  height: templateStyles[p.templateType]?.height,
                }}
              >
                <PriceCard item={p} styleConfig={templateStyles[p.templateType]} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
