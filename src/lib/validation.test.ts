import { describe, expect, it } from "vitest";

import { parseStoreSearchParams, reportSchema, storeSchema } from "@/lib/validation";

describe("validation", () => {
  it("parses public store search params", () => {
    const parsed = parseStoreSearchParams({
      sido: "서울특별시",
      sigungu: "성동구",
      q: "버터",
    });

    expect(parsed).toEqual({
      sido: "서울특별시",
      sigungu: "성동구",
      q: "버터",
    });
  });

  it("validates anonymous store registration payload", () => {
    const parsed = storeSchema.safeParse({
      name: "버터필름 수성",
      summary: "수성못 근처의 예약제 버터떡 작업실",
      address: "대구광역시 수성구 용학로 106",
      sido: "대구광역시",
      sigungu: "수성구",
      latitude: 35.8256,
      longitude: 128.6146,
      kakaoMapUrl: "https://place.map.kakao.com/123456",
      naverMapUrl: "https://map.naver.com/p/entry/place/1234567890",
      googleMapUrl: "https://maps.app.goo.gl/exampleShareLink",
      imageUrls: ["https://example.com/store.jpg"],
    });

    expect(parsed.success).toBe(true);
  });

  it("allows store registration without a representative image", () => {
    const parsed = storeSchema.safeParse({
      name: "버터필름 수성",
      summary: "수성못 근처의 예약제 버터떡 작업실",
      address: "대구광역시 수성구 용학로 106",
      sido: "대구광역시",
      sigungu: "수성구",
      latitude: 35.8256,
      longitude: 128.6146,
    });

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.imageUrls).toEqual([]);
    }
  });

  it("rejects invalid external map share links", () => {
    const parsed = storeSchema.safeParse({
      name: "버터필름 수성",
      summary: "수성못 근처의 예약제 버터떡 작업실",
      address: "대구광역시 수성구 용학로 106",
      sido: "대구광역시",
      sigungu: "수성구",
      latitude: 35.8256,
      longitude: 128.6146,
      kakaoMapUrl: "not-a-url",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires detailed notes for reports", () => {
    const parsed = reportSchema.safeParse({
      storeId: "store-seongsu",
      reportType: "other",
      note: "짧음",
    });

    expect(parsed.success).toBe(false);
  });
});
