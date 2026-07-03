"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProductTemplate } from "@/lib/types";
import { PRODUCT_TEMPLATES } from "@/lib/templates";
import { useStore } from "@/lib/store";
import { toNumber } from "@/lib/utils";
import { normalizeVolume } from "@/lib/template-demos";
import { ProductSearch } from "./product-search";
import { TemplatePresetPicker, applyPresetToProductForm } from "@/components/templates/template-preset-picker";
import { SavedNameField } from "@/components/templates/saved-name-field";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  { label: "빨강", value: "hsl(var(--brand-red))" },
  { label: "주황", value: "hsl(var(--brand-orange))" },
  { label: "파랑", value: "hsl(var(--brand-blue))" },
  { label: "초록", value: "#1f7a4d" },
  { label: "라임", value: "#b8d62e" },
  { label: "검정", value: "#111111" },
];

const empty = {
  brand: "",
  name: "",
  category: "",
  tab2: "",
  volume: "",
  price: "",
  wholesalePrice: "",
  tags: "",
  highlight: "",
  subtitle: "",
  eventText: "",
  description: "",
  memo: "",
};

export function ProductForm() {
  const defaultTemplateId = useStore((s) => s.defaultTemplateId);
  const [f, setF] = useState({ ...empty });
  const [template, setTemplate] = useState<ProductTemplate>(defaultTemplateId);
  const [color, setColor] = useState(COLORS[0].value);
  const addProduct = useStore((s) => s.addProduct);
  const savedBrandNames = useStore((s) => s.savedBrandNames);
  const savedCategoryNames = useStore((s) => s.savedCategoryNames);
  const savedTab2Names = useStore((s) => s.savedTab2Names);
  const trashedBrandNames = useStore((s) => s.trashedBrandNames);
  const trashedCategoryNames = useStore((s) => s.trashedCategoryNames);
  const trashedTab2Names = useStore((s) => s.trashedTab2Names);
  const {
    saveBrandName,
    saveCategoryName,
    saveTab2Name,
    removeSavedBrandName,
    removeSavedCategoryName,
    removeSavedTab2Name,
    restoreSavedBrandName,
    restoreSavedCategoryName,
    restoreSavedTab2Name,
  } = useStore();
  const formSnapshot = useRef<{ f: typeof empty; template: ProductTemplate; color: string } | null>(null);

  const set = (k: keyof typeof empty, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!f.name.trim()) {
      toast.error("상품명을 입력해 주세요.");
      return;
    }
    addProduct({
      brand: f.brand.trim() || undefined,
      name: f.name.trim(),
      category: f.category.trim() || undefined,
      tab2: f.tab2.trim() || undefined,
      volume: normalizeVolume(f.volume.trim()) || undefined,
      price: toNumber(f.price),
      wholesalePrice: f.wholesalePrice ? toNumber(f.wholesalePrice) : undefined,
      tags: f.tags ? f.tags.split(/[#,\s]+/).filter(Boolean) : undefined,
      highlightWords: f.highlight
        ? f.highlight.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
        : undefined,
      subtitle: f.subtitle.trim() || undefined,
      eventText: f.eventText.trim() || undefined,
      description: f.description.trim() || undefined,
      memo: f.memo.trim() || undefined,
      templateType: template,
      cardColor: color,
    });
    toast.success("카드를 추가했어요.");
    setF((p) => ({ ...empty, category: p.category, tab2: p.tab2, brand: p.brand }));
  };

  return (
    <div className="space-y-4">
      <ProductSearch
        onPick={(c) => {
          set("name", c.name);
          set("volume", c.volume);
          set("price", String(c.price));
          toast.success("검색 결과를 입력란에 채웠어요.");
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="상품명" required>
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="핸드 우레아 크림"
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        <SavedNameField
          label="브랜드"
          value={f.brand}
          onChange={(v) => set("brand", v)}
          savedNames={savedBrandNames}
          trashedNames={trashedBrandNames}
          onSave={saveBrandName}
          onRemove={removeSavedBrandName}
          onRestore={restoreSavedBrandName}
          placeholder="유쏘 (탭 왼쪽)"
        />
        <SavedNameField
          label="탭2"
          value={f.tab2}
          onChange={(v) => set("tab2", v)}
          savedNames={savedTab2Names}
          trashedNames={trashedTab2Names}
          onSave={saveTab2Name}
          onRemove={removeSavedTab2Name}
          onRestore={restoreSavedTab2Name}
          placeholder="바이오 (실무용 탭)"
        />
        <SavedNameField
          label="카테고리"
          value={f.category}
          onChange={(v) => set("category", v)}
          savedNames={savedCategoryNames}
          trashedNames={trashedCategoryNames}
          onSave={saveCategoryName}
          onRemove={removeSavedCategoryName}
          onRestore={restoreSavedCategoryName}
          placeholder="스킨케어"
        />
        <Field label="용량 / 단위">
          <Input
            value={f.volume}
            onChange={(e) => set("volume", e.target.value)}
            onBlur={() => set("volume", normalizeVolume(f.volume))}
            placeholder="50 또는 50ml"
          />
        </Field>
        <Field label="판매가 (가격)">
          <Input value={f.price} inputMode="numeric" onChange={(e) => set("price", e.target.value)} placeholder="15000"
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        <Field label="원가 / 도매가">
          <Input value={f.wholesalePrice} inputMode="numeric" onChange={(e) => set("wholesalePrice", e.target.value)} placeholder="(행사 카드 취소선)" />
        </Field>
        <Field label="부제목">
          <Input value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="(선택)" />
        </Field>
        <Field label="행사 문구">
          <Input value={f.eventText} onChange={(e) => set("eventText", e.target.value)} placeholder="1+1 / 세일" />
        </Field>
        <Field label="해시태그">
          <Input value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="#보습 #진정 #영양" />
        </Field>
        <Field label="상품명 강조">
          <Input value={f.highlight} onChange={(e) => set("highlight", e.target.value)} placeholder="퓨리파잉 (실무용)" />
        </Field>
        <Field label="포인트 색상">
          <Select value={color} onChange={(e) => setColor(e.target.value)}>
            {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="설명 문구">
        <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="카드 하단 설명 (선택)" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="메모 (카드 미표시)">
          <Input value={f.memo} onChange={(e) => set("memo", e.target.value)} placeholder="내부 메모" />
        </Field>
        <Field label="템플릿">
          <Select value={template} onChange={(e) => setTemplate(e.target.value as ProductTemplate)}>
            {PRODUCT_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </Select>
        </Field>
      </div>

      <TemplatePresetPicker
        templateType={template}
        demo={{
          brand: f.brand,
          category: f.category,
          tab2: f.tab2,
          name: f.name,
          volume: f.volume,
          price: toNumber(f.price),
          subtitle: f.subtitle,
          eventText: f.eventText,
          tags: f.tags ? f.tags.split(/[#,\s]+/).filter(Boolean) : undefined,
          highlightWords: f.highlight
            ? f.highlight.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
            : undefined,
          templateType: template,
          cardColor: color,
        }}
        showAllPresets
        onPreview={(preset) => {
          if (!formSnapshot.current) {
            formSnapshot.current = { f: { ...f }, template, color };
          }
          applyPresetToProductForm(preset, {
            setTemplate,
            setColor,
            setField: (key, value) => set(key as keyof typeof empty, value),
          });
        }}
        onConfirm={() => {
          formSnapshot.current = null;
        }}
        onCancel={() => {
          const snap = formSnapshot.current;
          if (snap) {
            setF(snap.f);
            setTemplate(snap.template);
            setColor(snap.color);
          }
          formSnapshot.current = null;
        }}
      />

      <Button onClick={submit} className="w-full" size="lg">
        <Plus /> 상품 추가
      </Button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
