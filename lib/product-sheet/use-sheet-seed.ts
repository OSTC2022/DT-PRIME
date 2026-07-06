"use client";

import { useEffect, useRef } from "react";
import { importProductCardTemplateBackup } from "./sheet-backup";
import { SHEET_SEED_VERSION, SHEET_SEED_VERSION_KEY } from "./storage-keys";

/** 배포 기본 JSON으로 저장 데이터·기준점 일괄 맞춤 (버전 올릴 때마다 1회) */
export function useSheetSeed() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || typeof window === "undefined") return;
    checked.current = true;

    void (async () => {
      try {
        const seedVer = parseInt(localStorage.getItem(SHEET_SEED_VERSION_KEY) ?? "0", 10);
        if (seedVer >= SHEET_SEED_VERSION) return;

        const res = await fetch("/product-card-template-default.json", { cache: "no-store" });
        if (!res.ok) return;

        importProductCardTemplateBackup(await res.text());
        localStorage.setItem(SHEET_SEED_VERSION_KEY, String(SHEET_SEED_VERSION));
        window.location.reload();
      } catch (error) {
        console.warn("[product-card-template seed]", error);
      }
    })();
  }, []);
}
