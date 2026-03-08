import { NextResponse } from "next/server";

import { repository } from "@/lib/repository";
import { reportSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (body === null) {
    return NextResponse.json(
      { message: "신고 입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "신고 입력값이 올바르지 않습니다.",
      },
      { status: 400 },
    );
  }

  try {
    const report = await repository.createReport(parsed.data);
    return NextResponse.json({
      message: "오정보 신고가 접수되었습니다.",
      report,
    });
  } catch (error) {
    console.error("[api/reports] Failed to create report.", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "신고를 접수하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
