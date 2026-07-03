"use client";

import { useMemo } from "react";
import { PRODUCT_TEMPLATES, TEXT_TEMPLATES } from "@/lib/templates";
import { ProductTemplateEditor } from "@/components/templates/product-template-editor";
import { ProductTemplateBulkEditor } from "@/components/templates/product-template-bulk-editor";
import { TextTemplateEditor } from "@/components/templates/text-template-editor";
import { BankTemplateEditor } from "@/components/templates/bank-template-editor";
import { useMounted } from "@/lib/use-mounted";
import { useStore } from "@/lib/store";
import { clonesForTemplate } from "@/lib/template-clones";
import { TemplateCloneTrashBin } from "@/components/templates/template-clone-trash";

export default function TemplatesPage() {
  const mounted = useMounted();
  const defaultTemplateId = useStore((s) => s.defaultTemplateId);
  const templateClones = useStore((s) => s.templateClones);

  const sortedTemplates = useMemo(() => {
    const rest = PRODUCT_TEMPLATES.filter((t) => t.id !== defaultTemplateId);
    const def = PRODUCT_TEMPLATES.find((t) => t.id === defaultTemplateId);
    return def ? [def, ...rest] : PRODUCT_TEMPLATES;
  }, [defaultTemplateId]);

  const editorItems = useMemo(() => {
    const items: Array<
      | { kind: "builtin"; template: (typeof PRODUCT_TEMPLATES)[number] }
      | { kind: "clone"; template: (typeof PRODUCT_TEMPLATES)[number]; cloneId: string }
    > = [];
    for (const t of sortedTemplates) {
      items.push({ kind: "builtin", template: t });
      for (const c of clonesForTemplate(templateClones, t.id)) {
        items.push({ kind: "clone", template: t, cloneId: c.id });
      }
    }
    return items;
  }, [sortedTemplates, templateClones]);

  if (!mounted) return <div className="p-5 text-muted-foreground">불러오는 중…</div>;

  return (
    <div className="p-5">
      <h1 className="text-xl font-black">카드 템플릿 관리</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        각 가격표 템플릿을 편집하고, 크기·색상·글씨 설정을 저장해 두었다가 불러올 수 있습니다.
      </p>
      <p className="mb-6 text-xs text-muted-foreground">
        카드 오른쪽 아래 핸들을 드래그해 크기를 조절하세요. 저장한 설정은 상품 가격표·안내 카드·계좌 카드 화면에도
        반영됩니다.
      </p>

      <ProductTemplateBulkEditor />

      <Section
        title="템플릿별 개별 편집"
        desc="상품명·강조단어·용량·해시태그·가격은 템플릿마다 따로 설정합니다. 브랜드·카테고리·스타일은 위 일괄 편집을 사용하세요."
      >
        {editorItems.map((item) =>
          item.kind === "builtin" ? (
            <ProductTemplateEditor
              key={item.template.id}
              templateId={item.template.id}
              label={item.template.label}
              desc={item.template.desc}
              isDefault={item.template.id === defaultTemplateId}
            />
          ) : (
            <ProductTemplateEditor
              key={item.cloneId}
              templateId={item.template.id}
              cloneId={item.cloneId}
              label={item.template.label}
              desc={item.template.desc}
            />
          )
        )}
      </Section>

      <Section
        title="안내 문구 템플릿"
        desc="제목·문구·강조 단어를 템플릿마다 편집합니다. 안내 문구 카드 추가 시 선택한 템플릿의 기본값으로 채워집니다."
      >
        {TEXT_TEMPLATES.map((t) => (
          <TextTemplateEditor key={t.id} templateId={t.id} label={t.label} desc={t.desc} />
        ))}
      </Section>

      <Section
        title="계좌 안내 템플릿"
        desc="로고·은행·계좌·안내 문구를 편집합니다. 계좌 안내 카드 추가 시 기본값으로 사용됩니다."
      >
        <BankTemplateEditor label="계좌 안내 카드" desc="흰 배경 · 주황 로고 · 안내 박스" />
      </Section>
      <TemplateCloneTrashBin />
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-1 font-black">{title}</h2>
      {desc ? <p className="mb-3 text-xs text-muted-foreground">{desc}</p> : <div className="mb-2" />}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  );
}
