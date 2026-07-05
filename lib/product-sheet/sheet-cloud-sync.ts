import { SYNC_META_KEY } from "./storage-keys";

/** Vercel Blob에 저장하는 공유 스냅샷 (기기 간 동기화) */
export const CLOUD_SNAPSHOT_BLOB_PATH = "product-card-template/v4/snapshot.json";

export const CLOUD_SNAPSHOT_API = "/api/product-card-template/snapshot";

export function getSyncMeta(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { exportedAt?: string };
    return typeof parsed.exportedAt === "string" ? parsed.exportedAt : null;
  } catch {
    return null;
  }
}

export function setSyncMeta(exportedAt: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ exportedAt }));
  } catch {
    /* quota */
  }
}

export function clearSyncMeta() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SYNC_META_KEY);
}
