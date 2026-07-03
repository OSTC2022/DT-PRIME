import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 숫자만 추출 */
export function toNumber(v: string | number | undefined | null): number {
  if (v == null) return 0;
  const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** 12000 -> ₩12,000 */
export function won(v: string | number | undefined | null): string {
  return "₩" + toNumber(v).toLocaleString("ko-KR");
}

/** 12000 -> 12,000원 */
export function krw(v: string | number | undefined | null): string {
  return toNumber(v).toLocaleString("ko-KR") + "원";
}

export function uid(prefix = "id"): string {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 파일명 안전화 */
export function safeFileName(s: string): string {
  return (s || "card").replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_").slice(0, 40);
}
