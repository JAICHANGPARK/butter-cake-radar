"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { readJsonResponse } from "@/lib/fetch";

export function StoreReportForm({
  storeId,
}: {
  storeId: string;
}) {
  const router = useRouter();
  const [reportType, setReportType] = useState<
    "wrong_info" | "closed" | "duplicate" | "other"
  >("wrong_info");
  const [note, setNote] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      id="report"
      className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(58,40,12,0.08)]"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        setError(null);

        startTransition(async () => {
          const response = await fetch("/api/reports", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              storeId,
              reportType,
              note,
              reporterName,
              reporterContact,
            }),
          });

          const data = await readJsonResponse<{ message?: string }>(response);

          if (!response.ok) {
            setError(data?.message ?? "신고를 접수하지 못했습니다.");
            return;
          }

          setMessage("오정보 신고가 접수되었습니다. 아래 이력에도 바로 반영됩니다.");
          setNote("");
          setReporterName("");
          setReporterContact("");
          setReportType("wrong_info");
          router.refresh();
        });
      }}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
          Report
        </p>
        <h2 className="mt-2 font-heading text-3xl text-stone-950">오정보 신고</h2>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">신고 유형</span>
          <select
            value={reportType}
            onChange={(event) =>
              setReportType(
                event.target.value as "wrong_info" | "closed" | "duplicate" | "other",
              )
            }
            className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
          >
            <option value="wrong_info">정보가 틀림</option>
            <option value="closed">폐업 또는 장기 휴점</option>
            <option value="duplicate">중복 등록</option>
            <option value="other">기타</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">신고 내용</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="h-28 w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            placeholder="무엇이 잘못됐는지 구체적으로 적어주세요."
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">이름 (선택)</span>
            <input
              value={reporterName}
              onChange={(event) => setReporterName(event.target.value)}
              className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
              placeholder="익명 가능"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">연락처 (선택)</span>
            <input
              value={reporterContact}
              onChange={(event) => setReporterContact(event.target.value)}
              className="w-full rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
              placeholder="이메일 또는 SNS"
            />
          </label>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        신고 보내기
      </button>
    </form>
  );
}
