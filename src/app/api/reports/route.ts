import { NextResponse } from "next/server";

import { repository } from "@/lib/repository";
import { reportSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "신고 입력값이 올바르지 않습니다.",
      },
      { status: 400 },
    );
  }

  const report = await repository.createReport(parsed.data);
  return NextResponse.json({
    message: "오정보 신고가 접수되었습니다.",
    report,
  });
}
