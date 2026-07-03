"use client";

import { useEffect, useState } from "react";
import { BankCardView } from "@/components/cards/bank-card";
import { ResizablePreview } from "@/components/templates/resizable-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  BankCardDemoData,
  DEFAULT_BANK_CARD_DEMO,
  demoToBankCard,
  resolveBankCardDemo,
} from "@/lib/bank-card-demos";
import { useStore } from "@/lib/store";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="text-xs font-black text-muted-foreground">{title}</span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open ? <div className="border-t px-3 pb-3 pt-2">{children}</div> : null}
    </div>
  );
}

export function BankTemplateEditor({ label, desc }: { label: string; desc: string }) {
  const storedDemo = useStore((s) => s.bankCardDemo);
  const updateBankCardDemo = useStore((s) => s.updateBankCardDemo);

  const [open, setOpen] = useState(false);
  const [demo, setDemo] = useState<BankCardDemoData>(() => resolveBankCardDemo(storedDemo));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    content: true,
    logo: false,
    info: false,
    notice: false,
    card: false,
  });

  useEffect(() => {
    if (storedDemo) setDemo(resolveBankCardDemo(storedDemo));
  }, [storedDemo]);

  const patch = (p: Partial<BankCardDemoData>) => {
    setDemo((d) => {
      const next = resolveBankCardDemo({ ...d, ...p });
      updateBankCardDemo(p);
      return next;
    });
  };

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="rounded-lg border bg-white">
      <div className="grid-paper flex justify-center rounded-t-lg p-3">
        <ResizablePreview
          width={demo.width ?? 320}
          height={demo.height ?? 220}
          onResize={(size) => patch(size)}
        >
          <div className="size-full">
            <BankCardView card={demoToBankCard(demo)} className="size-full" />
          </div>
        </ResizablePreview>
      </div>

      <div className="border-t px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold">{label}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            <Pencil className="size-3.5" />
            {open ? "닫기" : "편집"}
          </Button>
        </div>

        {open ? (
          <div className="mt-4 space-y-3 border-t pt-4">
            <p className="text-[11px] text-muted-foreground">
              미리보기를 드래그해 크기를 조절하고, 글씨·색상을 수정할 수 있습니다.
            </p>

            <CollapsibleSection
              title="문구"
              open={!!expanded.content}
              onToggle={() => toggle("content")}
            >
              <div className="space-y-3">
                <Field label="상단 로고 텍스트">
                  <Input value={demo.logoText} onChange={(e) => patch({ logoText: e.target.value })} />
                </Field>
                <Field label="은행명">
                  <Input value={demo.bankName} onChange={(e) => patch({ bankName: e.target.value })} />
                </Field>
                <Field label="계좌번호">
                  <Input
                    value={demo.accountNumber}
                    onChange={(e) => patch({ accountNumber: e.target.value })}
                  />
                </Field>
                <Field label="예금주">
                  <Input
                    value={demo.accountHolder}
                    onChange={(e) => patch({ accountHolder: e.target.value })}
                  />
                </Field>
                <Field label="하단 안내 문구">
                  <Input value={demo.noticeText} onChange={(e) => patch({ noticeText: e.target.value })} />
                </Field>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="로고" open={!!expanded.logo} onToggle={() => toggle("logo")}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="로고 크기 (px)">
                  <Input
                    type="number"
                    value={demo.logoFontSize ?? 20}
                    onChange={(e) => patch({ logoFontSize: Number(e.target.value) })}
                  />
                </Field>
                <Field label="로고 색">
                  <ColorInput
                    value={demo.logoColor ?? "#f97316"}
                    onChange={(v) => patch({ logoColor: v })}
                  />
                </Field>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="계좌 정보 글씨" open={!!expanded.info} onToggle={() => toggle("info")}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="글씨 크기 (px)">
                  <Input
                    type="number"
                    value={demo.infoFontSize ?? 24}
                    onChange={(e) => patch({ infoFontSize: Number(e.target.value) })}
                  />
                </Field>
                <Field label="글씨 색">
                  <ColorInput
                    value={demo.infoColor ?? "#171717"}
                    onChange={(v) => patch({ infoColor: v })}
                  />
                </Field>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="안내 박스" open={!!expanded.notice} onToggle={() => toggle("notice")}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="글씨 크기 (px)">
                  <Input
                    type="number"
                    value={demo.noticeFontSize ?? 14}
                    onChange={(e) => patch({ noticeFontSize: Number(e.target.value) })}
                  />
                </Field>
                <Field label="글씨 색">
                  <ColorInput
                    value={demo.noticeColor ?? "#ffffff"}
                    onChange={(v) => patch({ noticeColor: v })}
                  />
                </Field>
                <Field label="박스 배경색" className="col-span-2">
                  <ColorInput
                    value={demo.noticeBgColor ?? "#f97316"}
                    onChange={(v) => patch({ noticeBgColor: v })}
                  />
                </Field>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="카드 · 테두리" open={!!expanded.card} onToggle={() => toggle("card")}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="너비 (px)">
                  <Input
                    type="number"
                    value={demo.width ?? 320}
                    onChange={(e) => patch({ width: Number(e.target.value) })}
                  />
                </Field>
                <Field label="높이 (px)">
                  <Input
                    type="number"
                    value={demo.height ?? 220}
                    onChange={(e) => patch({ height: Number(e.target.value) })}
                  />
                </Field>
                <Field label="안쪽 여백 (px)">
                  <Input
                    type="number"
                    value={demo.padding ?? 24}
                    onChange={(e) => patch({ padding: Number(e.target.value) })}
                  />
                </Field>
                <Field label="테두리 두께">
                  <Input
                    type="number"
                    value={demo.borderWidth ?? 2}
                    onChange={(e) => patch({ borderWidth: Number(e.target.value) })}
                  />
                </Field>
                <Field label="모서리 둥글기">
                  <Input
                    type="number"
                    value={demo.borderRadius ?? 6}
                    onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
                  />
                </Field>
                <Field label="카드 배경색">
                  <ColorInput
                    value={demo.backgroundColor ?? "#ffffff"}
                    onChange={(v) => patch({ backgroundColor: v })}
                  />
                </Field>
                <Field label="테두리 색" className="col-span-2">
                  <ColorInput
                    value={demo.borderColor ?? "#171717"}
                    onChange={(v) => patch({ borderColor: v })}
                  />
                </Field>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-[10px]"
                onClick={() =>
                  patch({
                    width: DEFAULT_BANK_CARD_DEMO.width,
                    height: DEFAULT_BANK_CARD_DEMO.height,
                    padding: DEFAULT_BANK_CARD_DEMO.padding,
                    borderWidth: DEFAULT_BANK_CARD_DEMO.borderWidth,
                    borderRadius: DEFAULT_BANK_CARD_DEMO.borderRadius,
                  })
                }
              >
                크기·테두리 기본값
              </Button>
            </CollapsibleSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-[11px]">{label}</Label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hex = value.startsWith("#") ? value : "#f97316";
  return (
    <div className="flex gap-1">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1" />
    </div>
  );
}
