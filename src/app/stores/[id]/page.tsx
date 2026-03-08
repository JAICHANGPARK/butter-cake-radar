import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Instagram,
  Link2,
  MapPin,
  Phone,
} from "lucide-react";

import { StoreReportForm } from "@/components/store-report-form";
import { repository } from "@/lib/repository";
import type { ReportStatus, ReportType } from "@/lib/types";

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  wrong_info: "정보가 틀림",
  closed: "폐업 또는 장기 휴점",
  duplicate: "중복 등록",
  other: "기타",
};

const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "접수됨",
  reviewed: "정리됨",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await repository.getStoreById(id);

  if (!store || store.status === "disabled") {
    notFound();
  }

  const hasImages = store.images.length > 0;
  const mapLinks = [
    { label: "카카오지도", href: store.kakaoMapUrl },
    { label: "네이버지도", href: store.naverMapUrl },
    { label: "구글 지도", href: store.googleMapUrl },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
      <Link href="/" className="text-sm font-medium text-stone-500">
        ← 지도로 돌아가기
      </Link>

      <section className={`grid gap-6 ${hasImages ? "lg:grid-cols-[1.05fr_0.95fr]" : ""}`}>
        {hasImages ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {store.images.map((image) => (
              <div
                key={image.id}
                className="relative min-h-[220px] overflow-hidden rounded-[28px] border border-white/70 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.imageUrl}
                  alt={image.altText ?? store.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(58,40,12,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Store Detail
          </p>
          <h1 className="mt-3 font-heading text-5xl text-stone-950">{store.name}</h1>
          <p className="mt-4 text-base leading-8 text-stone-700">{store.summary}</p>

          <div className="mt-6 grid gap-4">
            <div className="flex items-start gap-3 rounded-[22px] bg-stone-50 p-4">
              <MapPin className="mt-1 h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-stone-900">주소</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">{store.address}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-[22px] bg-stone-50 p-4">
                <Clock3 className="mt-1 h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-stone-900">운영시간</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {store.openingHours ?? "정보 준비 중"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[22px] bg-stone-50 p-4">
                <Phone className="mt-1 h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-stone-900">연락처</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {store.phone ?? "정보 준비 중"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              신고 이력 {store.reportCount}건
            </span>
            {hasImages ? null : (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                등록된 대표 사진 없음
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {store.websiteUrl ? (
              <a
                href={store.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900"
              >
                <Link2 className="h-4 w-4" />
                홈페이지
              </a>
            ) : null}
            {store.instagramUrl ? (
              <a
                href={store.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900"
              >
                <Instagram className="h-4 w-4" />
                인스타그램
              </a>
            ) : null}
            {mapLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900"
              >
                <MapPin className="h-4 w-4" />
                {link.label}
              </a>
            ))}
            <Link
              href="#report"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900"
            >
              오정보 신고
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(58,40,12,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Report History
              </p>
              <h2 className="mt-2 font-heading text-3xl text-stone-950">
                오정보 신고 이력
              </h2>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
              최신 신고순
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {store.reports.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm leading-6 text-stone-600">
                아직 접수된 오정보 신고가 없습니다.
              </div>
            ) : (
              store.reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-[24px] border border-stone-200 bg-stone-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                        {REPORT_TYPE_LABEL[report.reportType]}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          report.status === "pending"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {report.status === "pending" ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {REPORT_STATUS_LABEL[report.status]}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-stone-500">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-stone-700">{report.note}</p>

                  <p className="mt-3 text-xs text-stone-500">
                    제보자: {report.reporterName?.trim() || "익명"}
                  </p>

                  {report.resolution ? (
                    <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-stone-600">
                      처리 메모: {report.resolution}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>

        <StoreReportForm storeId={store.id} />
      </section>
    </div>
  );
}
