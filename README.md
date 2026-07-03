# 상품 가격표 자동 생성기

엑셀에서 손으로 만들던 **상품 가격표 · 안내 문구 카드 · 계좌 안내 카드**를
웹에서 입력만으로 자동 생성하는 관리자용 웹앱입니다.

- **Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui 스타일 컴포넌트**
- 상태/저장: **Zustand + localStorage** (추후 Supabase로 교체 쉽게 설계)
- 반응형: 데스크톱은 좌측 사이드바, 모바일은 상단 탭

## 실행 방법

```bash
npm install
npm run dev
# http://localhost:3000
```

> 빌드: `npm run build && npm start`

## 화면 구성

| 경로 | 메뉴 | 설명 |
|------|------|------|
| `/` | 대시보드 | 카드 현황·합계·바로가기, 샘플 불러오기/비우기 |
| `/products` | 상품 가격표 | 단일 입력 / 대량 붙여넣기, 미리보기·드래그 정렬·선택삭제·템플릿 변경 |
| `/text-cards` | 안내 문구 카드 | 제목·강조단어·이모지·배경 템플릿 |
| `/bank-cards` | 계좌 안내 카드 | 로고·은행·계좌·예금주·안내문구 |
| `/templates` | 카드 템플릿 관리 | 전체 템플릿 썸네일 미리보기 |
| `/download` | 다운로드 | 엑셀/PNG/PDF(준비 중) · 인쇄(동작) |

## 주요 기능

- **간단 입력 자동 분리**: `핸드 우레아 크림 50ml 15000` 또는 `이름 / 용량 / 가격` 형식을 자동 인식 → 표로 보여주고 수정 후 카드 생성 (`lib/parse.ts`)
- **대량 붙여넣기**: 엑셀에서 복사한 여러 줄을 그대로 붙여넣기
- **카드 편집**: 카드에 마우스 올리면 선택·템플릿 변경·삭제, 드래그로 순서 변경
- **상품 자동 검색 자리**: 현재는 mock(`lib/sample-data.ts`의 `mockSearch`). 실제 API로 교체만 하면 됨
- **인쇄**: 사이드바·툴바를 숨기고 카드만 출력하는 인쇄 CSS 포함

## 코드 구조

```
app/
  layout.tsx          루트 레이아웃 (사이드바+상단바+토스트)
  page.tsx            대시보드
  products/           상품 가격표
  text-cards/         안내 문구 카드
  bank-cards/         계좌 안내 카드
  templates/          템플릿 갤러리
  download/           다운로드 허브
  api/export/excel/   엑셀 내보내기 API 자리 (501 반환)
components/
  ui/                 shadcn 스타일 기본 컴포넌트 (radix 무의존)
  cards/              실제 카드 디자인 (price/text/bank)
  products/           입력 폼·대량 붙여넣기·검색·다운로드 바
  layout/             사이드바·상단바
lib/
  types.ts            ProductItem / TextCard / BankCard
  store.ts            Zustand 스토어 (← Supabase 교체 지점)
  parse.ts            한 줄/대량 자동 분리 파서
  sample-data.ts      샘플 + mock 검색
  templates.ts        템플릿 메타
  utils.ts            cn, 통화/숫자 포맷 등
```

## 추후 연결 가이드 (Cursor)

1. **Supabase 저장**
   `lib/store.ts`의 각 액션 본문만 supabase 호출로 교체하세요.
   화면 코드는 스토어 API만 쓰므로 그대로 둬도 됩니다.
   ```ts
   // 예: addProduct
   await supabase.from("products").insert(payload);
   ```

2. **엑셀 다운로드 (ExcelJS)**
   `app/api/export/excel/route.ts`에 구현 예시가 주석으로 들어 있습니다.
   `npm i exceljs` 후 주석을 풀고, `download-bar.tsx`의 버튼에서 fetch 하세요.

3. **PNG / PDF 다운로드**
   `npm i html-to-image jspdf` → 카드 DOM을 캡처해 저장하도록 `download-bar.tsx`를 연결하세요.

4. **상품 자동 검색 (네이버 쇼핑/도매 API)**
   `components/products/product-search.tsx`의 `mockSearch`를
   `fetch("/api/search?q=...")` 로 바꾸고 API route를 추가하면 됩니다.

## 참고

- 데이터는 브라우저 `localStorage`에 저장됩니다. 다른 기기와 공유하려면 Supabase 연결이 필요합니다.
- shadcn/ui CLI 없이 동작하도록 `components/ui`에 컴포넌트를 직접 포함했습니다(= shadcn의 실제 사용 방식). 추가 컴포넌트가 필요하면 `npx shadcn@latest add <name>` 으로 받으면 됩니다.
