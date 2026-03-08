import { NextResponse } from "next/server";

import { repository } from "@/lib/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const store = await repository.getStoreById(id);

  if (!store || store.status === "disabled") {
    return NextResponse.json(
      { message: "매장을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ store });
}
