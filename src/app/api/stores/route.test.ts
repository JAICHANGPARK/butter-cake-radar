import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/stores/route";
import { repository } from "@/lib/repository";

describe("POST /api/stores", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a validation error when the request body is not valid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "입력값이 올바르지 않습니다.",
    });
  });

  it("returns a JSON error when store creation fails", async () => {
    vi.spyOn(repository, "createStore").mockRejectedValueOnce(
      new Error("저장소에 매장을 저장하지 못했습니다."),
    );

    const response = await POST(
      new Request("http://localhost/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "데이라이트",
          summary: "상하이 버터떡이 인기인 디저트 가게입니다.",
          address: "서울 구로구 새말로18길 64",
          sido: "서울특별시",
          sigungu: "구로구",
          latitude: 37.505489,
          longitude: 126.892583,
          phone: "0507-1333-6231",
          websiteUrl: "",
          instagramUrl: "https://www.instagram.com/daylight_cake",
          kakaoMapUrl: "",
          naverMapUrl: "https://naver.me/FUhtOlii",
          googleMapUrl: "",
          imageUrls: [],
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      message: "저장소에 매장을 저장하지 못했습니다.",
    });
  });
});
