"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TemplatePresetPicker } from "@/components/templates/template-preset-picker";
import { useProductExcelExport } from "@/components/products/product-excel-export-provider";
import { FileSpreadsheet, ImageDown, FileDown, Printer } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";
import { toast } from "sonner";
import { useState } from "react";

export default function DownloadPage() {
  const products = useStore((s) => s.products);
  const textCards = useStore((s) => s.textCards);
  const bankCards = useStore((s) => s.bankCards);
  const templateStyles = useStore((s) => s.templateStyles);

  const mounted = useMounted();
  const [exporting, setExporting] = useState(false);
  const { exportExcel } = useProductExcelExport();

  if (!mounted) return <div className="p-5 text-muted-foreground">불러오는 중…</div>;

  const handleExcel = async () => {
    if (products.length === 0) {
      toast.error("보낼 상품이 없어요.");
      return;
    }
    setExporting(true);
    try {
      await exportExcel({
        products,
        templateStyles,
        shape: "square",
      });
      toast.success(`전체 ${products.length}개 카드를 엑셀로 다운로드했어요.`);
    } catch {
      toast.error("엑셀 다운로드에 실패했어요.");
    } finally {
      setExporting(false);
    }
  };

  const soon = (label: string) =>
    toast.info(`${label} 기능은 연결 준비 중입니다.`, {
      description: "PNG / PDF는 추후 연결 예정입니다.",
    });

  const items = [
    {
      icon: FileSpreadsheet,
      title: "엑셀 다운로드",
      desc: "웹 화면과 동일한 카드 디자인을 이미지로 캡처해 엑셀에 배치합니다. 원본 데이터 시트도 함께 생성됩니다.",
      action: handleExcel,
      ready: true,
      loading: exporting,
    },
    {
      icon: ImageDown,
      title: "PNG 이미지 다운로드",
      desc: "카드 각각을 고화질 PNG로 저장합니다. (html-to-image 연결 예정)",
      action: () => soon("PNG 다운로드"),
      ready: false,
      loading: false,
    },
    {
      icon: FileDown,
      title: "PDF 다운로드",
      desc: "카드 전체를 인쇄용 PDF 한 장으로 모읍니다. (jsPDF 연결 예정)",
      action: () => soon("PDF 다운로드"),
      ready: false,
      loading: false,
    },
    {
      icon: Printer,
      title: "인쇄하기",
      desc: "상품·안내·계좌 카드 화면에서 카드를 클릭하거나 「전체 인쇄」 버튼을 사용하세요.",
      action: () => {
        toast.info("카드가 있는 화면에서 인쇄해 주세요.", {
          description: "상품 가격표 / 안내 문구 / 계좌 안내 메뉴로 이동 후 카드를 클릭하세요.",
        });
      },
      ready: true,
      loading: false,
    },
  ];

  return (
    <div className="p-5">
      <h1 className="text-xl font-black">엑셀 / 이미지 다운로드</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        현재 등록: 상품 {products.length} · 안내 카드 {textCards.length} · 계좌 카드 {bankCards.length}
      </p>

      <div className="no-print mb-6 max-w-xl">
        <TemplatePresetPicker showAllPresets />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Card key={it.title}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-lg bg-accent p-3">
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{it.title}</span>
                    {it.ready ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">사용 가능</span>
                    ) : (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">준비 중</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={it.action}
                    disabled={Boolean(it.loading)}
                  >
                    {it.loading ? "카드 캡처 중…" : "실행"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
