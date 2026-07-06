"use client";

import { useEffect, useRef } from "react";
import { importProductCardTemplateBackup } from "./sheet-backup";
import {
  hasBaselineSnapshot,
  loadPersistedSnapshot,
} from "./sheet-storage";
import { ProductCardTemplateSnapshot } from "./sheet-snapshot";
import { SHEET_SEED_VERSION, SHEET_SEED_VERSION_KEY } from "./storage-keys";

function isLegacyScaledFonts(snapshot: ProductCardTemplateSnapshot): boolean {
  const gs = snapshot.globalStyle;
  return (gs.brandFontSize ?? 15) > 16 || (gs.titleFontSize ?? 15) > 16;
}

function isCorruptedSnapshot(snapshot: ProductCardTemplateSnapshot): boolean {
  const gs = snapshot.globalStyle;
  if ((gs.brandFontSize ?? 15) > 16 && (gs.height ?? 125) <= 130) return true;
  if ((gs.titleFontSize ?? 15) > 16 && (gs.height ?? 125) <= 125) return true;
  return false;
}

function shouldApplyBundledDefault(): boolean {
  const snapshot = loadPersistedSnapshot();
  if (!snapshot) return true;
  if (isCorruptedSnapshot(snapshot)) return true;
  if (isLegacyScaledFonts(snapshot) && !hasBaselineSnapshot()) return true;
  return false;
}

/** 배포 기본 JSON으로 깨진·없는 저장 데이터 복구 */
export function useSheetSeed() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || typeof window === "undefined") return;
    checked.current = true;

    void (async () => {
      try {
        const seedVer = parseInt(localStorage.getItem(SHEET_SEED_VERSION_KEY) ?? "0", 10);
        if (seedVer >= SHEET_SEED_VERSION) return;

        if (!shouldApplyBundledDefault()) {
          localStorage.setItem(SHEET_SEED_VERSION_KEY, String(SHEET_SEED_VERSION));
          return;
        }

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
