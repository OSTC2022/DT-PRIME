import { ProductCardTemplateBackupFile } from "./sheet-backup";
import { CLOUD_SNAPSHOT_API } from "./sheet-cloud-sync";

export type CloudSyncResult =
  | { ok: true; updatedAt?: string }
  | { ok: false; configured: boolean; message: string };

export async function fetchCloudBackup(): Promise<ProductCardTemplateBackupFile | null> {
  const res = await fetch(CLOUD_SNAPSHOT_API, { cache: "no-store" });
  if (res.status === 503) return null;
  if (!res.ok) return null;

  const json = (await res.json()) as { snapshot?: ProductCardTemplateBackupFile | null };
  return json.snapshot ?? null;
}

export async function uploadCloudBackup(
  backup: ProductCardTemplateBackupFile
): Promise<CloudSyncResult> {
  const res = await fetch(CLOUD_SNAPSHOT_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(backup),
  });

  if (res.status === 503) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      ok: false,
      configured: false,
      message: json.error ?? "클라우드 저장소가 연결되지 않았습니다.",
    };
  }

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      ok: false,
      configured: true,
      message: json.error ?? "클라우드 저장에 실패했습니다.",
    };
  }

  const json = (await res.json()) as { updatedAt?: string };
  return { ok: true, updatedAt: json.updatedAt };
}
