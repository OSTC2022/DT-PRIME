"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "대시보드" },
  { href: "/products", label: "상품 가격표" },
  { href: "/text-cards", label: "안내 문구" },
  { href: "/bank-cards", label: "계좌 안내" },
  { href: "/templates", label: "템플릿" },
  { href: "/download", label: "다운로드" },
];

export function Topbar() {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="flex items-center gap-4 px-5 py-3">
        <div className="font-black md:hidden">상품 가격표 생성기</div>
        <nav className="-mx-1 flex gap-1 overflow-x-auto md:hidden">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto hidden text-sm text-muted-foreground md:block">
          실무용 카드 제작 · 로컬 저장
        </div>
      </div>
    </header>
  );
}
