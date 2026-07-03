"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  MessageSquareText,
  Landmark,
  LayoutTemplate,
  Download,
  Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/products", label: "상품 가격표", icon: Tag },
  { href: "/product-card-template", label: "제품 관리 카드", icon: Grid3x3 },
  { href: "/text-cards", label: "안내 문구 카드", icon: MessageSquareText },
  { href: "/bank-cards", label: "계좌 안내 카드", icon: Landmark },
  { href: "/templates", label: "카드 템플릿 관리", icon: LayoutTemplate },
  { href: "/download", label: "엑셀 / 이미지 다운로드", icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="no-print hidden w-60 shrink-0 border-r bg-white md:block">
      <div className="px-5 py-5">
        <div className="text-[11px] font-bold tracking-[0.18em] text-brand-red">PRICE CARD</div>
        <div className="text-base font-black leading-tight">상품 가격표 자동 생성기</div>
      </div>
      <nav className="px-3 pb-6">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
