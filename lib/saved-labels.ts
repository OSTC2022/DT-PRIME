/**
 * 창고형 약국 가격표 — 브랜드·카테고리·탭2 기본 목록
 * 드롭다운 순서 = 아래 배열 순서 (가나다 정렬 아님)
 */

/** 제조사·브랜드 (탭 왼쪽 / 상품 브랜드) */
export const DEFAULT_SAVED_BRANDS = [
  "유쏘", // 유쏘랩 바이오
  "Dr'life",
  "HAEYO", // Dr'life 해모 라인
  "HANMI", // 한미약품
  "한미", // 한미약품 (국문 표기)
  "프로캄", // 한미 프로캄 라인
  "도미나", // 동아 색소침착
  "멜라토닝",
  "멜라노사",
  "이지에프", // EGF 새살연고
  "노드라나", // 피부건조
  "종근당", // 더마-K · PDRN
];

/**
 * 카테고리 (일반 가격카드 상단 · 진료과/효능 대분류)
 */
export const DEFAULT_SAVED_CATEGORIES = [
  "스킨케어",
  "바이오",
  "색소침착",
  "재생·상처",
  "연고",
  "피부건조",
  "선케어",
  "립케어",
  "PDRN·안티에이징",
  "앰플",
  "마스크팩",
  "클렌저",
  "토너·로션",
  "패치",
  "헤어",
];

/**
 * 탭2 (실무용 카드 오른쪽 탭 · 브랜드 내 라인·진열 구분)
 */
export const DEFAULT_SAVED_TAB2 = [
  // 유쏘랩 라인
  "바이오",
  "리제너레이션",
  "인텐시브",
  "레티놀",
  "수분·히알루론",
  "진정·시카",
  "미백",
  "선케어",
  "마스크팩",
  "클렌저",
  "토너·로션",
  // 색소·미백 전문
  "색소침착",
  // 프로캄·한미
  "PRO-CALM",
  "상처·재생",
  "타박상·소염",
  "립케어",
  // Dr'life
  "HAEYO",
  // 연고·전문 단품
  "새살 연고",
  "피부건조",
  "PDRN",
  "부스터샷",
  // 공통
  "스킨케어",
  "크림",
];

export function sortSavedNames(names: string[]): string[] {
  return [...names].sort((a, b) => a.localeCompare(b, "ko"));
}

export function addSavedName(list: string[], name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return list;
  if (list.some((n) => n === trimmed)) return list;
  return [...list, trimmed];
}

/** 기본 목록 순서 유지 + 사용자 추가 항목은 맨 뒤에 가나다순 */
export function mergeSavedCatalog(
  persisted: string[] | undefined,
  catalog: string[]
): string[] {
  const all = new Set([...(persisted ?? []), ...catalog]);
  const ordered = catalog.filter((n) => all.has(n));
  const extra = sortSavedNames(Array.from(all).filter((n) => !catalog.includes(n)));
  return [...ordered, ...extra];
}
