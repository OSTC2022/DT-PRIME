// 사양서 12번 데이터 구조

export type ProductTemplate =
  | "basic" // 기본 가격표 카드
  | "premium" // 고급 화장품 가격표 카드
  | "rounded" // 둥근 모서리 상품 카드
  | "line" // 색상 라인 상품 카드
  | "dark" // 검정 배경 강조 카드
  | "event" // 행사 상품 카드
  | "set" // 세트 상품 카드
  | "practical"; // 실무용 탭·해시태그 카드

export type CardShape = "square" | "wide";

export interface ProductItem {
  id: string;
  brand?: string;
  name: string;
  category?: string;
  /** 실무용(practical) 카드 두 번째 탭 문구 */
  tab2?: string;
  volume?: string; // 용량/단위 (예: 50ml, 14매)
  price: number; // 표시 가격(판매가 기본)
  wholesalePrice?: number; // 원가/도매가
  retailPrice?: number; // 판매가
  tags?: string[]; // 해시태그
  highlightWords?: string[]; // 상품명 강조 단어
  subtitle?: string; // 부제목
  eventText?: string; // 행사 문구
  description?: string;
  memo?: string;
  /** 추가 검색어 (별칭) */
  searchAliases?: string[];
  templateType: ProductTemplate;
  cardColor?: string; // 라인/포인트 색상 (hsl 또는 hex)
}

export type TextCardTemplate = "sky" | "yellow" | "rounded" | "outline";

export interface TextCard {
  id: string;
  title: string;
  content: string; // 본문(줄바꿈 포함)
  highlightWords: string[]; // 강조 단어
  highlightColor?: string; // 강조 색 (red | blue | hex)
  emoji?: string;
  backgroundColor?: string;
  borderColor?: string;
  templateType: TextCardTemplate;
  width?: number;
  height?: number;
  titleFontSize?: number;
  contentFontSize?: number;
  titleColor?: string;
  contentColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

export interface BankCard {
  id: string;
  logoText: string; // 상단 로고 텍스트
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  noticeText: string; // 하단 안내 문구
  width?: number;
  height?: number;
  logoFontSize?: number;
  logoColor?: string;
  infoFontSize?: number;
  infoColor?: string;
  noticeFontSize?: number;
  noticeColor?: string;
  noticeBgColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
}
