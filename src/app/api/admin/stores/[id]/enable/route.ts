import { NextResponse } from "next/server";

import { repository } from "@/lib/repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const store = await repository.setStoreStatus({
    id,
    status: "active",
  });

  if (!store) {
    return NextResponse.json(
      { message: "매장을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    message: "매장을 다시 노출했습니다.",
    store,
  });
}
