"use client";

import { useEffect, useRef } from "react";
import { importProductCardTemplateBackup } from "./sheet-backup";
import { fetchCloudBackup } from "./sheet-cloud-client";
import { getSyncMeta, setSyncMeta } from "./sheet-cloud-sync";

/** 페이지 로드 시 클라우드에 더 최신 저장본이 있으면 적용 */
export function useCloudSheetSync() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || typeof window === "undefined") return;
    checked.current = true;

    void (async () => {
      try {
        const backup = await fetchCloudBackup();
        if (!backup?.exportedAt || !backup.data) return;

        const cloudAt = Date.parse(backup.exportedAt);
        if (!Number.isFinite(cloudAt)) return;

        const localMeta = getSyncMeta();
        if (localMeta) {
          const localAt = Date.parse(localMeta);
          if (Number.isFinite(localAt) && cloudAt <= localAt) return;
        }

        importProductCardTemplateBackup(JSON.stringify(backup));
        setSyncMeta(backup.exportedAt);
        window.location.reload();
      } catch (error) {
        console.warn("[product-card-template cloud-sync]", error);
      }
    })();
  }, []);
}
