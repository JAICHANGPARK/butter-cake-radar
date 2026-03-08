import type { Metadata } from "next";

import { MapBrowser } from "@/components/map-browser";
import { env } from "@/lib/env";
import { getRepositoryRuntime, repository } from "@/lib/repository";
import { parseStoreSearchParams } from "@/lib/validation";

export const metadata: Metadata = {
  title: "버터떡 가게 지도",
  description:
    "서울, 경기, 부산 등 전국 버터떡 가게를 지도에서 찾고, 매장 정보와 오정보 신고 이력을 확인하세요.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "버터떡 가게 지도",
    description:
      "서울, 경기, 부산 등 전국 버터떡 가게를 지도에서 찾고, 매장 정보와 오정보 신고 이력을 확인하세요.",
    url: env.siteUrl,
    type: "website",
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, regions] = await Promise.all([searchParams, repository.getRegions()]);
  const filters = parseStoreSearchParams(params);
  const stores = await repository.listStores(filters);
  const runtime = getRepositoryRuntime();

  return (
    <MapBrowser
      key={JSON.stringify(filters)}
      stores={stores}
      filters={filters}
      regions={regions}
      isDemoMode={runtime.mode === "demo"}
      setupFallbackReason={runtime.fallbackReason}
    />
  );
}
