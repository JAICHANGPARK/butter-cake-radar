import { NextResponse } from "next/server";

import { repository } from "@/lib/repository";
import { reviewReportSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const body = await request.json().catch(() => ({}));
  const parsed = reviewReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "검토 메모 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const report = await repository.reviewReport({
    id,
    resolution: parsed.data.resolution,
  });

  if (!report) {
    return NextResponse.json(
      { message: "신고를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    message: "신고를 검토 완료로 처리했습니다.",
    report,
  });
}
