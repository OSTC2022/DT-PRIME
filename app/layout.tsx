import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/sonner";
import { StoreHydration } from "@/components/store-hydration";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "상품 가격표 자동 생성기",
  description: "상품 가격표 · 안내 문구 · 계좌 안내 카드를 입력만으로 자동 생성",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <StoreHydration />
        <AppProviders>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1">{children}</main>
          </div>
        </div>
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
