import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "버터떡맵",
  description: "버터떡 가게를 OpenStreetMap 위에서 찾고, 등록하고, 신고 이력을 확인할 수 있는 지도 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-stone-50 text-stone-900">
          <AppHeader />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
