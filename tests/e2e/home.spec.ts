import { expect, test } from "@playwright/test";

test("지도 홈에서 지역 필터와 주요 CTA가 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "누구나 등록하고 신고로 정리하는 버터떡맵" })).toBeVisible();
  await expect(page.getByRole("link", { name: "가게 등록하기" })).toBeVisible();
  await expect(page.getByText("위치 기능 비활성화")).toBeVisible();
  await expect(page.getByText("OpenStreetMap 타일 사용")).toBeVisible();
});
