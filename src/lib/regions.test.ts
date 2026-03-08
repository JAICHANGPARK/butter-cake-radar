import { describe, expect, it } from "vitest";

import { resolveSido, resolveSigungu } from "@/lib/regions";

describe("regions", () => {
  it("normalizes short sido names from postcode results", () => {
    expect(
      resolveSido({
        nextSido: "경기",
        addressCandidates: ["경기 성남시 분당구 대왕판교로 477 (판교동)"],
      }),
    ).toBe("경기도");

    expect(
      resolveSido({
        nextSido: "서울",
        addressCandidates: ["서울 마포구 동교로51길 13 (연남동)"],
      }),
    ).toBe("서울특별시");
  });

  it("matches sigungu from address strings", () => {
    expect(
      resolveSigungu({
        nextSido: "경기도",
        nextSigungu: "성남시",
        addressCandidates: ["경기 성남시 분당구 대왕판교로 477 (판교동)"],
      }),
    ).toBe("성남시 분당구");

    expect(
      resolveSigungu({
        nextSido: "서울특별시",
        nextSigungu: "",
        addressCandidates: ["서울 마포구 동교로51길 13 (연남동)"],
      }),
    ).toBe("마포구");
  });
});
