import { BankCard, ProductItem, TextCard } from "./types";

export const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: "p_practical_1",
    brand: "유쏘",
    category: "바이오",
    name: "센시티브 퓨리파잉 미스",
    highlightWords: ["퓨리파잉"],
    tags: ["보습", "진정", "영양", "티트리추출물함유"],
    volume: "150ml",
    price: 32000,
    templateType: "practical",
    cardColor: "#b8d62e",
  },
  { id: "p_sample_1", name: "핸드 우레아 크림", volume: "50ml", price: 15000, category: "스킨케어", templateType: "basic" },
  { id: "p_sample_2", name: "멜라 터치 크림", volume: "35ml", price: 40000, category: "스킨케어", templateType: "basic" },
  { id: "p_sample_3", name: "페이셜 리페어 크림", volume: "50ml", price: 25000, category: "스킨케어", templateType: "basic" },
  { id: "p_sample_4", name: "PDRN 앰플", volume: "30ml", price: 35000, category: "앰플", templateType: "premium" },
  { id: "p_sample_5", name: "컴포트 선크림", volume: "50ml", price: 18000, category: "선케어", templateType: "basic" },
  { id: "p_sample_6", name: "마데카 멜라패치", volume: "14매", price: 10000, category: "패치", templateType: "basic" },
  { id: "p_sample_7", name: "판테신 토닉", volume: "100ml", price: 20000, category: "헤어", templateType: "basic" },
  { id: "p_sample_8", name: "판테신 샴푸", volume: "500ml", price: 30000, category: "헤어", templateType: "basic" },
];

export const SAMPLE_TEXT_CARDS: TextCard[] = [
  {
    id: "t_sample_1",
    title: '"설사" 시',
    content: "마시는 수액!",
    highlightWords: ["수액"],
    highlightColor: "blue",
    templateType: "sky",
  },
  {
    id: "t_sample_2",
    title: "감기&몸살 때",
    content: '"아연 비타민B,C"\n같이 드세요',
    highlightWords: ["아연 비타민B,C"],
    highlightColor: "red",
    emoji: "🙂",
    templateType: "yellow",
  },
  {
    id: "t_sample_3",
    title: "🌞무더위",
    content: "땀과다&목마름에\n마시는 여름보약!",
    highlightWords: ["땀과다&목마름", "여름보약"],
    highlightColor: "blue",
    templateType: "sky",
  },
];

export const SAMPLE_BANK_CARDS: BankCard[] = [
  {
    id: "b_sample_1",
    logoText: "동큰+",
    bankName: "경남은행",
    accountNumber: "9216-9214",
    accountHolder: "최태환",
    noticeText: "이체 후 직원에게 꼭 말씀해 주세요!",
  },
];

/** 자동검색 mock (사양서 11번) */
export interface SearchCandidate {
  name: string;
  volume: string;
  price: number;
  source: string;
}

export function mockSearch(query: string): SearchCandidate[] {
  const q = query.trim();
  if (!q) return [];
  const base = SAMPLE_PRODUCTS.filter((p) => p.name.includes(q)).map((p) => ({
    name: p.name,
    volume: p.volume || "",
    price: p.price,
    source: "샘플 도매처",
  }));
  // 항상 후보 몇 개를 보여주기 위한 mock 결과
  return [
    ...base,
    { name: `${q} (대용량)`, volume: "100ml", price: 28000, source: "도매처 A" },
    { name: `${q} 리필`, volume: "50ml", price: 16000, source: "도매처 B" },
    { name: q, volume: "30ml", price: 12000, source: "네이버 쇼핑(예시)" },
  ];
}
