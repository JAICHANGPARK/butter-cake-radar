import { NextResponse } from "next/server";

import { repository } from "@/lib/repository";
import { parseStoreSearchParams, storeSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseStoreSearchParams({
    sido: searchParams.get("sido") ?? undefined,
    sigungu: searchParams.get("sigungu") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    includeDisabled: searchParams.get("includeDisabled") ?? undefined,
  });

  const stores = await repository.listStores(filters);
  return NextResponse.json({ stores, filters });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (body === null) {
    return NextResponse.json(
      { message: "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const parsed = storeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      },
      { status: 400 },
    );
  }

  try {
    const store = await repository.createStore(parsed.data);
    return NextResponse.json({
      message: "가게가 등록되었습니다.",
      store,
    });
  } catch (error) {
    console.error("[api/stores] Failed to create store.", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "가게 등록 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
