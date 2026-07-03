import { ProductTemplate, TextCardTemplate } from "./types";

export interface TemplateMeta {
  id: string;
  label: string;
  group: "product" | "text" | "bank";
  desc: string;
}

export const PRODUCT_TEMPLATES: { id: ProductTemplate; label: string; desc: string }[] = [
  { id: "basic", label: "기본 가격표", desc: "흰 배경 · 검정 테두리 · 빨간 가격" },
  { id: "premium", label: "고급 화장품", desc: "여백 넉넉 · 가는 라인 · 세리프 느낌" },
  { id: "rounded", label: "둥근 모서리", desc: "라운드 카드 · 부드러운 그림자" },
  { id: "line", label: "색상 라인", desc: "상단 컬러 바 포인트" },
  { id: "dark", label: "검정 강조", desc: "검정 배경 · 흰 글씨 강조" },
  { id: "event", label: "행사 상품", desc: "행사 배지 · 원가 취소선" },
  { id: "set", label: "세트 상품", desc: "세트 구성 강조 배경" },
  { id: "practical", label: "실무용 탭 카드", desc: "브랜드 탭 · 해시태그 · 라임 포인트" },
];

export const TEXT_TEMPLATES: { id: TextCardTemplate; label: string; desc: string }[] = [
  { id: "sky", label: "하늘색 안내", desc: "하늘색 배경 · 둥근 모서리" },
  { id: "yellow", label: "노란색 강조", desc: "노란 배경 · 주의 환기" },
  { id: "rounded", label: "둥근 화이트", desc: "흰 배경 · 컬러 테두리" },
  { id: "outline", label: "라인 강조", desc: "흰 배경 · 굵은 테두리" },
];

export const ALL_TEMPLATES: TemplateMeta[] = [
  ...PRODUCT_TEMPLATES.map((t) => ({ id: t.id, label: t.label, group: "product" as const, desc: t.desc })),
  ...TEXT_TEMPLATES.map((t) => ({ id: t.id, label: t.label, group: "text" as const, desc: t.desc })),
  { id: "bank", label: "계좌 안내 카드", group: "bank", desc: "흰 배경 · 주황 로고 · 안내 박스" },
];
