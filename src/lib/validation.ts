import { z } from "zod";

import type { StoreSearchFilters } from "@/lib/types";
import { MAX_STORE_IMAGE_COUNT } from "@/lib/uploads";

const textField = (
  label: string,
  options: { min?: number; max: number },
) => {
  let schema = z.string().trim();

  if (options.min !== undefined) {
    schema = schema.min(options.min, `${label}은(는) ${options.min}자 이상 입력해 주세요.`);
  }

  return schema.max(
    options.max,
    `${label}은(는) ${options.max}자 이하로 입력해 주세요.`,
  );
};

const optionalTextField = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label}은(는) ${max}자 이하로 입력해 주세요.`)
    .optional();

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || URL.canParse(value), {
      message: `${label} 링크 형식이 올바르지 않습니다.`,
    })
    .optional();

export const storeSearchSchema = z.object({
  sido: z.string().trim().optional(),
  sigungu: z.string().trim().optional(),
  q: z.string().trim().optional(),
  includeDisabled: z.coerce.boolean().optional(),
});

export const storeSchema = z.object({
  name: textField("상호명", { min: 2, max: 60 }),
  summary: textField("한 줄 소개", { min: 5, max: 180 }),
  address: textField("주소", { min: 5, max: 160 }),
  sido: textField("시/도", { min: 2, max: 30 }),
  sigungu: textField("시군구", { min: 1, max: 40 }),
  latitude: z.coerce
    .number()
    .min(32, "지도에서 매장 위치를 선택해 주세요.")
    .max(39.5, "지도에서 매장 위치를 선택해 주세요."),
  longitude: z.coerce
    .number()
    .min(124, "지도에서 매장 위치를 선택해 주세요.")
    .max(132, "지도에서 매장 위치를 선택해 주세요."),
  phone: optionalTextField("연락처", 30),
  openingHours: optionalTextField("운영시간", 120),
  websiteUrl: optionalUrl("홈페이지"),
  instagramUrl: optionalUrl("인스타그램"),
  kakaoMapUrl: optionalUrl("카카오지도"),
  naverMapUrl: optionalUrl("네이버지도"),
  googleMapUrl: optionalUrl("구글 지도"),
  imageUrls: z
    .array(z.string().trim().min(1))
    .max(MAX_STORE_IMAGE_COUNT, `이미지는 최대 ${MAX_STORE_IMAGE_COUNT}장까지 등록할 수 있습니다.`)
    .default([]),
});

export const reportSchema = z.object({
  storeId: z.string().trim().min(1, "매장 정보가 올바르지 않습니다."),
  reportType: z.enum(["wrong_info", "closed", "duplicate", "other"]),
  note: textField("신고 내용", { min: 5, max: 300 }),
  reporterName: optionalTextField("이름", 40),
  reporterContact: optionalTextField("연락처", 80),
});

export const storeStatusSchema = z.object({
  reason: optionalTextField("사유", 300),
});

export const reviewReportSchema = z.object({
  resolution: optionalTextField("처리 메모", 300),
});

export const parseStoreSearchParams = (
  params: Record<string, string | string[] | undefined>,
): StoreSearchFilters =>
  storeSearchSchema.parse({
    sido:
      typeof params.sido === "string" && params.sido ? params.sido : undefined,
    sigungu:
      typeof params.sigungu === "string" && params.sigungu
        ? params.sigungu
        : undefined,
    q: typeof params.q === "string" && params.q ? params.q : undefined,
    includeDisabled:
      typeof params.includeDisabled === "string"
        ? params.includeDisabled === "true"
        : undefined,
  });
