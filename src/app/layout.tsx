import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import { AppHeader } from "@/components/app-header";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "버터떡맵",
    template: "%s | 버터떡맵",
  },
  description:
    "버터떡 가게를 지도에서 찾고, 직접 등록하고, 오정보 신고 이력을 확인할 수 있는 지도 서비스",
  applicationName: "버터떡맵",
  keywords: [
    "버터떡",
    "버터떡 맛집",
    "버터떡 지도",
    "디저트 지도",
    "떡 맛집",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: env.siteUrl,
    siteName: "버터떡맵",
    title: "버터떡맵",
    description:
      "버터떡 가게를 지도에서 찾고, 직접 등록하고, 오정보 신고 이력을 확인할 수 있는 지도 서비스",
  },
  twitter: {
    card: "summary_large_image",
    title: "버터떡맵",
    description:
      "버터떡 가게를 지도에서 찾고, 직접 등록하고, 오정보 신고 이력을 확인할 수 있는 지도 서비스",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <Analytics />
      </body>
    </html>
  );
}
