"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/** Next.js에서 persist가 복원되기 전 빈 상태로 덮어쓰는 것을 방지 */
export function StoreHydration() {
  useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);

  return null;
}
