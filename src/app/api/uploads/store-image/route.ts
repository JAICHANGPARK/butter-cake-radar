import { Buffer } from "node:buffer";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";
import {
  MAX_WEBP_FILE_SIZE_BYTES,
  STORE_IMAGE_BUCKET,
} from "@/lib/uploads";
import { getErrorMessage, isSupabaseSetupError } from "@/lib/supabase";
import { createId } from "@/lib/utils";

const createSupabaseAdminClient = () =>
  createClient(
    env.supabaseUrl || "https://placeholder.supabase.co",
    env.supabaseServiceRoleKey || "placeholder-service-role-key",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "업로드할 이미지 파일이 필요합니다." },
      { status: 400 },
    );
  }

  if (file.type !== "image/webp") {
    return NextResponse.json(
      { message: "업로드 이미지는 webp 형식이어야 합니다." },
      { status: 400 },
    );
  }

  if (file.size > MAX_WEBP_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { message: "변환된 이미지가 너무 큽니다. 더 작은 이미지로 다시 시도해 주세요." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      imageUrl: `data:image/webp;base64,${buffer.toString("base64")}`,
      storage: "inline",
    });
  }

  const supabase = createSupabaseAdminClient();
  const filePath = `stores/${createId()}.webp`;
  const { error } = await supabase.storage
    .from(STORE_IMAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    if (isSupabaseSetupError(error)) {
      console.warn(
        `[uploads] Supabase Storage is not ready. Falling back to inline image storage. ${getErrorMessage(error)}`,
      );
      return NextResponse.json({
        imageUrl: `data:image/webp;base64,${buffer.toString("base64")}`,
        storage: "inline",
      });
    }

    return NextResponse.json(
      {
        message:
          "이미지 업로드에 실패했습니다. Supabase Storage 버킷 `store-images`가 준비되어 있는지 확인해 주세요.",
      },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from(STORE_IMAGE_BUCKET).getPublicUrl(filePath);

  return NextResponse.json({
    imageUrl: data.publicUrl,
    storage: "supabase",
  });
}
