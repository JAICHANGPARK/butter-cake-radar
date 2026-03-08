import { beforeEach, describe, expect, it } from "vitest";

import { DemoRepository } from "@/lib/repository/demo-repository";

declare global {
  var __BUTTER_CAKE_RADAR_DEMO_DB__:
    | import("@/lib/demo-data").DemoDatabase
    | undefined;
}

describe("DemoRepository", () => {
  beforeEach(() => {
    globalThis.__BUTTER_CAKE_RADAR_DEMO_DB__ = undefined;
  });

  it("creates a store immediately without moderation", async () => {
    const repository = new DemoRepository();
    const store = await repository.createStore({
      name: "테스트 버터집",
      summary: "바로 공개되는 테스트 매장",
      address: "서울특별시 종로구 사직로 1",
      sido: "서울특별시",
      sigungu: "종로구",
      latitude: 37.576,
      longitude: 126.976,
      kakaoMapUrl: "https://place.map.kakao.com/123456",
      naverMapUrl: "https://map.naver.com/p/entry/place/1234567890",
      googleMapUrl: "https://maps.app.goo.gl/exampleShareLink",
      imageUrls: ["https://example.com/store.jpg"],
    });

    expect(store.status).toBe("active");
    expect(store.images).toHaveLength(1);
    expect(store.kakaoMapUrl).toBe("https://place.map.kakao.com/123456");
    expect(store.naverMapUrl).toBe("https://map.naver.com/p/entry/place/1234567890");
    expect(store.googleMapUrl).toBe("https://maps.app.goo.gl/exampleShareLink");
  });

  it("creates a store without images", async () => {
    const repository = new DemoRepository();
    const store = await repository.createStore({
      name: "이미지 없는 버터집",
      summary: "대표 이미지 없이 등록되는 테스트 매장",
      address: "서울특별시 중구 세종대로 110",
      sido: "서울특별시",
      sigungu: "중구",
      latitude: 37.5663,
      longitude: 126.9779,
      imageUrls: [],
    });

    expect(store.status).toBe("active");
    expect(store.images).toHaveLength(0);
  });

  it("adds pending misinformation reports", async () => {
    const repository = new DemoRepository();
    const report = await repository.createReport({
      storeId: "store-seongsu",
      reportType: "wrong_info",
      note: "운영시간이 달라졌습니다.",
    });

    const dashboard = await repository.listAdminDashboard();
    expect(report.status).toBe("pending");
    expect(
      dashboard.reports.some((entry) => entry.id === report.id),
    ).toBe(true);
  });

  it("disables a store and marks related pending reports reviewed", async () => {
    const repository = new DemoRepository();
    const store = await repository.setStoreStatus({
      id: "store-busan",
      status: "disabled",
      reason: "신고 다수로 검토 중",
    });
    const dashboard = await repository.listAdminDashboard();
    const pendingReports = dashboard.reports.filter(
      (report) => report.storeId === "store-busan" && report.status === "pending",
    );

    expect(store?.status).toBe("disabled");
    expect(pendingReports).toHaveLength(0);
  });
});
