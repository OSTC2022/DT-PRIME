import { NextResponse } from "next/server";
import { head, put } from "@vercel/blob";
import type { ProductCardTemplateBackupFile } from "@/lib/product-sheet/sheet-backup";
import { CLOUD_SNAPSHOT_BLOB_PATH } from "@/lib/product-sheet/sheet-cloud-sync";

export const dynamic = "force-dynamic";

function cloudUnavailable(message: string) {
  return NextResponse.json({ error: message, configured: false }, { status: 503 });
}

function isBackupFile(body: unknown): body is ProductCardTemplateBackupFile {
  if (typeof body !== "object" || body === null) return false;
  const record = body as Record<string, unknown>;
  return typeof record.exportedAt === "string" && typeof record.data === "object" && record.data !== null;
}

/** 모든 기기가 공유하는 제품 카드 스냅샷 조회 */
export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return cloudUnavailable("Vercel Blob이 연결되지 않았습니다.");
  }

  try {
    const meta = await head(CLOUD_SNAPSHOT_BLOB_PATH);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ snapshot: null, configured: true });
    }
    const snapshot = (await res.json()) as ProductCardTemplateBackupFile;
    return NextResponse.json({ snapshot, configured: true, updatedAt: meta.uploadedAt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("does not exist") || message.includes("not found")) {
      return NextResponse.json({ snapshot: null, configured: true });
    }
    return NextResponse.json(
      { error: "클라우드 스냅샷을 불러오지 못했습니다.", configured: true },
      { status: 500 }
    );
  }
}

/** 모든 기기가 공유하는 제품 카드 스냅샷 저장 */
export async function PUT(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return cloudUnavailable("Vercel Blob이 연결되지 않았습니다.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  if (!isBackupFile(body)) {
    return NextResponse.json({ error: "백업 파일 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const json = JSON.stringify(body);
  await put(CLOUD_SNAPSHOT_BLOB_PATH, json, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  return NextResponse.json({
    ok: true,
    configured: true,
    updatedAt: body.exportedAt,
    bytes: json.length,
  });
}
