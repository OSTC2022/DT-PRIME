const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

/** 한글·영문 문자열에서 초성 문자열 추출 */
export function toChosung(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      out += CHO[Math.floor((code - 0xac00) / 588)];
    } else {
      out += ch;
    }
  }
  return out;
}

/** 검색 적합도 (높을수록 위에 표시) */
function matchScore(name: string, query: string): number {
  const q = query.trim();
  if (!q) return 0;

  const lowerName = name.toLowerCase();
  const lowerQ = q.toLowerCase();
  const nameCh = toChosung(name).toLowerCase();
  const queryCh = toChosung(q).toLowerCase();

  if (lowerName.startsWith(lowerQ)) return 100_000;
  if (lowerName.includes(lowerQ)) return 50_000;

  if (!queryCh) return -1;

  // 초성 앞글자 일치 (ㅇ → 인텐시브, 이지에프 등)
  if (nameCh.startsWith(queryCh)) {
    return 40_000 + queryCh.length * 100 - nameCh.length;
  }

  // 초성 1글자는 맨 앞 초성 일치만 (ㅇ 입력 시 바이오 제외)
  if (queryCh.length === 1) return -1;

  // 여러 글자 초성 — 순서대로 포함 (ㅅㅋㅋ → 스킨케어)
  let qi = 0;
  for (let i = 0; i < nameCh.length && qi < queryCh.length; i++) {
    if (nameCh[i] === queryCh[qi]) qi++;
  }
  if (qi === queryCh.length) {
    const first = nameCh.indexOf(queryCh[0]);
    return 10_000 - first * 500;
  }

  return -1;
}

/** 검색어에 맞는 항목만 · 초성 일치 우선 · 초성순 정렬 */
export function filterSavedNames(names: string[], query: string): string[] {
  const q = query.trim();
  if (!q) return names;

  return names
    .map((name) => ({ name, score: matchScore(name, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return toChosung(a.name).localeCompare(toChosung(b.name), "ko");
    })
    .map((x) => x.name);
}
