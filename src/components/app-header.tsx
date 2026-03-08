"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-[600] border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-stone-200 bg-white">
            <span className="font-heading text-lg text-stone-900">BT</span>
          </div>
          <div>
            <p className="font-heading text-lg text-stone-950 md:text-xl">버터떡맵</p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
              Butter Cake Radar
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {isHome ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("butter-map:open-search"))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-800"
              aria-label="지도 검색 열기"
            >
              <Search className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800"
            >
              지도
            </Link>
          )}

          {pathname !== "/submit" ? (
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              등록
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
