import { describe, expect, it } from "vitest";

import { createDemoDatabase } from "@/lib/demo-data";
import {
  applyStoreFilters,
  buildStoreRelations,
  findSimilarStoreCandidates,
  normalizeText,
} from "@/lib/utils";

describe("utils", () => {
  it("normalizes Korean text for loose duplicate matching", () => {
    expect(normalizeText("버터 하우스 성수!")).toBe("버터하우스성수");
  });

  it("finds similar stores using name and address", () => {
    const database = createDemoDatabase();
    const stores = buildStoreRelations(
      database.stores,
      database.storeImages,
      database.storeReports,
    );

    const candidates = findSimilarStoreCandidates(stores, {
      name: "버터하우스 성수점",
      address: "서울특별시 성동구 연무장길 18",
      sido: "서울특별시",
      sigungu: "성동구",
    });

    expect(candidates[0]?.id).toBe("store-seongsu");
    expect(candidates[0]?.similarityScore).toBeGreaterThanOrEqual(80);
  });

  it("filters disabled stores from public search", () => {
    const database = createDemoDatabase();
    database.stores[0]!.status = "disabled";

    const stores = buildStoreRelations(
      database.stores,
      database.storeImages,
      database.storeReports,
    );

    const filtered = applyStoreFilters(stores, {});
    expect(filtered.some((store) => store.id === "store-seongsu")).toBe(false);
  });
});
