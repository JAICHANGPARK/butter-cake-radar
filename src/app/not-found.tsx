import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-20 text-center md:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        404
      </p>
      <h1 className="font-heading text-5xl text-stone-950">매장을 찾지 못했습니다</h1>
      <p className="text-sm leading-7 text-stone-600">
        삭제되었거나 아직 승인되지 않은 매장일 수 있습니다.
      </p>
      <Link
        href="/"
        className="mx-auto inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
      >
        지도 홈으로 이동
      </Link>
    </div>
  );
}
