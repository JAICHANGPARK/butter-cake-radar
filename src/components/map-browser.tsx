"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Filter,
  List,
  Search,
  Store as StoreIcon,
  X,
} from "lucide-react";

import { SIDO_OPTIONS, SIGUNGU_BY_SIDO } from "@/lib/regions";
import type { RegionRecord, StoreSearchFilters, StoreWithRelations } from "@/lib/types";

const StoreMap = dynamic(
  () => import("@/components/store-map").then((module) => module.StoreMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[calc(100dvh-72px)] place-items-center bg-stone-100 text-stone-500">
        오픈스트리트맵을 불러오는 중입니다.
      </div>
    ),
  },
);

export function MapBrowser({
  stores,
  filters,
  regions,
  isDemoMode,
  setupFallbackReason,
}: {
  stores: StoreWithRelations[];
  filters: StoreSearchFilters;
  regions: RegionRecord[];
  isDemoMode: boolean;
  setupFallbackReason?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [query, setQuery] = useState(filters.q ?? "");
  const [selectedSido, setSelectedSido] = useState(filters.sido ?? "");
  const [selectedSigungu, setSelectedSigungu] = useState(filters.sigungu ?? "");

  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? null;

  const sigunguOptions =
    selectedSido && selectedSido in SIGUNGU_BY_SIDO
      ? SIGUNGU_BY_SIDO[selectedSido as keyof typeof SIGUNGU_BY_SIDO]
      : [];

  useEffect(() => {
    const openSearch = () => setIsSearchOpen(true);

    window.addEventListener("butter-map:open-search", openSearch);
    return () => window.removeEventListener("butter-map:open-search", openSearch);
  }, []);

  const navigateWithFilters = (next: {
    q?: string;
    sido?: string;
    sigungu?: string;
  }) => {
    const params = new URLSearchParams();

    if (next.q) {
      params.set("q", next.q);
    }

    if (next.sido) {
      params.set("sido", next.sido);
    }

    if (next.sigungu) {
      params.set("sigungu", next.sigungu);
    }

    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  };

  return (
    <div className="relative h-[calc(100dvh-73px)] min-h-[560px] w-full overflow-hidden bg-[#f3dd9e] md:min-h-[720px]">
      <StoreMap
        stores={stores}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
        className="min-h-full rounded-none border-0 shadow-none"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fff8de]/58 via-[#fff4cf]/12 to-[#d4a53b]/18" />

      <div className="pointer-events-none absolute inset-0">
        {isSearchOpen ? (
          <div className="pointer-events-auto absolute inset-0 z-[520] bg-[#7a5b16]/10 backdrop-blur-[2px]">
            <div className="absolute inset-x-3 top-3 md:left-6 md:top-6 md:max-w-[380px]">
              <form
                className="rounded-[24px] border border-[#fff2c9] bg-[#fffaf0]/95 p-3 shadow-[0_18px_48px_rgba(94,72,18,0.14)] backdrop-blur-xl md:p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  startTransition(() => {
                    navigateWithFilters({
                      q: query.trim() || undefined,
                      sido: selectedSido || undefined,
                      sigungu: selectedSigungu || undefined,
                    });
                  });
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                      Search
                    </p>
                    <p className="mt-1 font-heading text-xl leading-tight text-stone-950 md:text-2xl">
                      지도 검색
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                      {stores.length}곳
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="rounded-full border border-stone-300 p-2 text-stone-700"
                      aria-label="지도 검색 닫기"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-stone-600">
                  <span className="rounded-full bg-stone-100 px-3 py-1">
                    {isDemoMode ? "데모 데이터" : "실데이터 연결"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1">
                    <Filter className="h-3 w-3" />
                    위치 기능 비활성화
                  </span>
                </div>

                {setupFallbackReason ? (
                  <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
                    저장소 설정이 아직 준비되지 않아 데모 데이터로 자동 전환했습니다.
                  </div>
                ) : null}

                <div className="mt-3 space-y-3">
                  <label className="block space-y-2">
                    <span className="text-xs font-medium text-stone-700">키워드</span>
                    <div className="flex items-center gap-2 rounded-[18px] border border-stone-200 bg-stone-50 px-3 py-2.5">
                      <Search className="h-4 w-4 text-stone-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="w-full bg-transparent text-sm text-stone-900 outline-none"
                        placeholder="상호명, 주소, 지역명을 검색하세요"
                      />
                    </div>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-xs font-medium text-stone-700">시/도</span>
                      <select
                        value={selectedSido}
                        onChange={(event) => {
                          setSelectedSido(event.target.value);
                          setSelectedSigungu("");
                        }}
                        className="w-full rounded-[18px] border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none"
                      >
                        <option value="">전체</option>
                        {SIDO_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-xs font-medium text-stone-700">시군구</span>
                      <select
                        value={selectedSigungu}
                        onChange={(event) => setSelectedSigungu(event.target.value)}
                        className="w-full rounded-[18px] border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none"
                        disabled={!selectedSido}
                      >
                        <option value="">전체</option>
                        {sigunguOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                    >
                      결과 보기
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-500"
                      onClick={() => {
                        setQuery("");
                        setSelectedSido("");
                        setSelectedSigungu("");
                        router.push(pathname);
                      }}
                    >
                      초기화
                    </button>
                    <span className="text-[11px] font-medium text-stone-500">
                      지역 데이터 {regions.length}개
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-auto absolute right-3 top-3 z-[500] md:right-6 md:top-6">
          <button
            type="button"
            onClick={() => setIsListOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#fff0be] bg-[#fff8e6]/94 px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-[0_14px_32px_rgba(94,72,18,0.14)] backdrop-blur-xl"
          >
            <List className="h-4 w-4" />
            리스트
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{stores.length}</span>
          </button>
        </div>

        {isListOpen ? (
          <div className="pointer-events-auto absolute inset-0 z-[520] bg-[#7a5b16]/12 backdrop-blur-[2px]">
            <div className="absolute inset-x-0 bottom-0 md:inset-y-6 md:right-6 md:left-auto md:w-[420px]">
              <section className="mx-3 flex h-[52dvh] flex-col rounded-t-[30px] border border-[#fff2c9] bg-[#fffaf0]/96 p-4 shadow-[0_-18px_48px_rgba(94,72,18,0.16)] backdrop-blur-xl md:mx-0 md:h-full md:rounded-[32px] md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                      Store List
                    </p>
                    <h2 className="mt-1 font-heading text-2xl text-stone-950">
                      {filters.sido || "전국"} 결과 {stores.length}곳
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsListOpen(false)}
                    className="rounded-full border border-stone-300 p-2 text-stone-700"
                    aria-label="리스트 닫기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {selectedStore ? (
                  <article className="mt-4 rounded-[28px] bg-stone-950 p-4 text-stone-50">
                    <div className="flex gap-3">
                      {selectedStore.images[0] ? (
                        <div className="relative h-24 w-24 overflow-hidden rounded-[20px] bg-stone-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedStore.images[0].imageUrl}
                            alt={selectedStore.images[0].altText ?? selectedStore.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="grid h-24 w-24 place-items-center rounded-[20px] bg-stone-800 text-xs font-semibold text-stone-300">
                          사진 없음
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
                          선택된 매장
                        </p>
                        <p className="mt-1 text-xl font-semibold text-white">
                          {selectedStore.name}
                        </p>
                        <p className="mt-1 text-sm text-stone-300">
                          {selectedStore.sido} {selectedStore.sigungu}
                        </p>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-200">
                          {selectedStore.summary}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-300" />
                        신고 이력 {selectedStore.reportCount}건
                      </span>
                      {selectedStore.images.length === 0 ? (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-200">
                          대표 사진 없음
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/stores/${selectedStore.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-950"
                      >
                        <StoreIcon className="h-4 w-4" />
                        상세 보기
                      </Link>
                      <Link
                        href={`/stores/${selectedStore.id}#report`}
                        className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                      >
                        오정보 신고
                      </Link>
                    </div>
                  </article>
                ) : null}

                <div className="mt-4 flex-1 overflow-y-auto pr-1">
                  {stores.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm leading-6 text-stone-600">
                      조건에 맞는 가게가 없습니다. 검색어를 줄이거나 지역 필터를 초기화해 보세요.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {stores.map((store) => {
                        const isSelected = selectedStoreId === store.id;

                        return (
                          <article
                            key={store.id}
                            className={`rounded-[26px] border transition ${
                              isSelected
                                ? "border-orange-300 bg-orange-50"
                                : "border-stone-200 bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              className="w-full p-3 text-left"
                              onClick={() => setSelectedStoreId(store.id)}
                            >
                              <div className="flex gap-3">
                                {store.images[0] ? (
                                  <div className="relative h-20 w-20 overflow-hidden rounded-[18px] bg-stone-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={store.images[0].imageUrl}
                                      alt={store.images[0].altText ?? store.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="grid h-20 w-20 place-items-center rounded-[18px] bg-stone-100 text-xs font-semibold text-stone-500">
                                    사진 없음
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-stone-950">{store.name}</p>
                                      <p className="mt-1 text-sm text-stone-500">
                                        {store.sido} {store.sigungu}
                                      </p>
                                    </div>
                                    {store.pendingReportCount > 0 ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        대기 {store.pendingReportCount}
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-700">
                                    {store.summary}
                                  </p>
                                </div>
                              </div>
                            </button>

                            <div className="flex flex-wrap gap-2 px-3 pb-3">
                              <Link
                                href={`/stores/${store.id}`}
                                className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-800"
                              >
                                <StoreIcon className="h-3.5 w-3.5" />
                                상세
                              </Link>
                              <Link
                                href={`/stores/${store.id}#report`}
                                className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-800"
                              >
                                오정보 신고
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
