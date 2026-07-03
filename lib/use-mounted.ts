"use client";
import { useEffect, useState } from "react";

/** localStorage 기반 스토어 읽기 전, 클라이언트 마운트 여부를 알려준다.
 *  SSR/CSR 하이드레이션 불일치를 방지하기 위해 사용한다. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
