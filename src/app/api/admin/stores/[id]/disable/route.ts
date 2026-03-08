import { NextResponse } from "next/server";

import { repository } from "@/lib/repository";
import { storeStatusSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const body = await request.json().catch(() => ({}));
  const parsed = storeStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "비활성화 사유 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const store = await repository.setStoreStatus({
    id,
    status: "disabled",
    reason: parsed.data.reason,
  });

  if (!store) {
    return NextResponse.json(
      { message: "매장을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    message: "매장을 비활성화했습니다.",
    store,
  });
}
